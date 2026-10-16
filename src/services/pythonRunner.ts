import { FileItem, ExecutionStatus } from '../types';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodide?: any;
    ide_on_stdout?: (text: string) => void;
    ide_on_stderr?: (text: string) => void;
    ide_request_input?: (prompt: string) => Promise<string>;
    ide_clear_terminal?: () => void;
  }
}

export type StdoutHandler = (text: string) => void;
export type StderrHandler = (text: string) => void;
export type StdinRequestHandler = (prompt: string) => Promise<string>;
export type StatusChangeHandler = (status: ExecutionStatus, message?: string) => void;
export type ClearHandler = () => void;

class PythonRunner {
  private pyodide: any = null;
  private isInitializing = false;
  private initPromise: Promise<any> | null = null;
  private currentStdinResolver: ((value: string) => void) | null = null;
  private currentStdinRejecter: ((reason?: any) => void) | null = null;
  private isExecuting = false;

  private stdoutHandler: StdoutHandler = console.log;
  private stderrHandler: StderrHandler = console.error;
  private stdinRequestHandler: StdinRequestHandler = async () => '';
  private statusHandler: StatusChangeHandler = () => {};
  private clearHandler: ClearHandler = () => {};

  public setHandlers(handlers: {
    onStdout?: StdoutHandler;
    onStderr?: StderrHandler;
    onStdinRequest?: StdinRequestHandler;
    onStatusChange?: StatusChangeHandler;
    onClear?: ClearHandler;
  }) {
    if (handlers.onStdout) this.stdoutHandler = handlers.onStdout;
    if (handlers.onStderr) this.stderrHandler = handlers.onStderr;
    if (handlers.onStdinRequest) this.stdinRequestHandler = handlers.onStdinRequest;
    if (handlers.onStatusChange) this.statusHandler = handlers.onStatusChange;
    if (handlers.onClear) this.clearHandler = handlers.onClear;
  }

  /**
   * Load Pyodide WebAssembly runtime
   */
  public async initialize(): Promise<any> {
    if (this.pyodide) return this.pyodide;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.statusHandler('loading', 'Loading Python 3.12 WebAssembly runtime...');

    this.initPromise = (async () => {
      try {
        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide CDN script.'));
            document.head.appendChild(script);
          });
        }

        const pyodide = await window.loadPyodide!({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });

        // Configure standard stdout and stderr
        pyodide.setStdout({
          batched: (text: string) => {
            this.stdoutHandler(text + '\n');
          }
        });

        pyodide.setStderr({
          batched: (text: string) => {
            this.stderrHandler(text + '\n');
          }
        });

        // Setup bridge functions in window for Python <-> JS interactive communication
        window.ide_on_stdout = (text: string) => {
          this.stdoutHandler(text);
        };

        window.ide_on_stderr = (text: string) => {
          this.stderrHandler(text);
        };

        window.ide_clear_terminal = () => {
          this.clearHandler();
        };

        window.ide_request_input = async (promptText: string) => {
          this.statusHandler('waiting_input', 'Waiting for user input in terminal...');
          return new Promise<string>((resolve, reject) => {
            this.currentStdinResolver = resolve;
            this.currentStdinRejecter = reject;
            this.stdinRequestHandler(promptText).then(resolve).catch(reject);
          });
        };

        // Bootstrap Python support code for AST rewriting and async input
        await pyodide.runPythonAsync(`
import sys
import os
import ast
import asyncio
import js
import builtins

# Ensure current working directory is in sys.path
if "" not in sys.path:
    sys.path.insert(0, "")
if "/" not in sys.path:
    sys.path.insert(0, "/")

# Hook os.system to support 'cls' and 'clear'
_original_os_system = getattr(os, 'system', None)
def _ide_os_system(cmd):
    cmd_clean = str(cmd).strip().lower()
    if cmd_clean in ('cls', 'clear'):
        if hasattr(js, 'ide_clear_terminal'):
            js.ide_clear_terminal()
        return 0
    if _original_os_system:
        try:
            return _original_os_system(cmd)
        except Exception:
            return 0
    return 0
os.system = _ide_os_system

async def __ide_async_input__(prompt=""):
    prompt_str = str(prompt)
    if prompt_str:
        js.ide_on_stdout(prompt_str)
    user_val = await js.ide_request_input(prompt_str)
    js.ide_on_stdout(str(user_val) + "\\n")
    return str(user_val)

class _IdeInputTransformer(ast.NodeTransformer):
    def __init__(self):
        self.transformed_funcs = set()

    def visit_Call(self, node):
        self.generic_visit(node)
        if isinstance(node.func, ast.Name) and node.func.id == 'input':
            new_call = ast.Call(
                func=ast.Name(id='__ide_async_input__', ctx=ast.Load()),
                args=node.args,
                keywords=node.keywords
            )
            ast.copy_location(new_call, node)
            return ast.Await(value=new_call)
        return node

    def visit_FunctionDef(self, node):
        self.generic_visit(node)
        # Check if function contains await expressions
        has_await = any(isinstance(n, (ast.Await, ast.AsyncFor, ast.AsyncWith)) for n in ast.walk(node))
        if has_await:
            self.transformed_funcs.add(node.name)
            async_node = ast.AsyncFunctionDef(
                name=node.name,
                args=node.args,
                body=node.body,
                decorator_list=node.decorator_list,
                returns=node.returns,
                type_comment=getattr(node, 'type_comment', None)
            )
            ast.copy_location(async_node, node)
            return async_node
        return node

def _prepare_and_run_code(source_code, filename="<editor>"):
    try:
        parsed = ast.parse(source_code, filename=filename)
    except SyntaxError:
        raise

    has_input = False
    for node in ast.walk(parsed):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
            has_input = True
            break

    if not has_input:
        return ('sync', None)

    transformer = _IdeInputTransformer()
    transformed = transformer.visit(parsed)
    ast.fix_missing_locations(transformed)

    # Wrap top-level statements in an async function
    wrapper_name = "__main_ide_coro__"
    async_wrapper = ast.AsyncFunctionDef(
        name=wrapper_name,
        args=ast.arguments(
            posonlyargs=[], args=[], vararg=None,
            kwonlyargs=[], kw_defaults=[], kwarg=None, defaults=[]
        ),
        body=transformed.body if transformed.body else [ast.Pass()],
        decorator_list=[],
        returns=None
    )
    ast.copy_location(async_wrapper, transformed)

    module_node = ast.Module(body=[async_wrapper], type_ignores=[])
    ast.fix_missing_locations(module_node)
    
    return ('async', module_node, wrapper_name)
`);

        this.pyodide = pyodide;
        this.isInitializing = false;
        this.statusHandler('idle', 'Python 3.12 (Pyodide WebAssembly) Ready');
        return pyodide;
      } catch (err: any) {
        this.isInitializing = false;
        this.initPromise = null;
        this.statusHandler('error', `Failed to initialize Python runtime: ${err?.message || err}`);
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Synchronize IDE files into Pyodide virtual filesystem
   */
  public async syncVirtualFiles(files: FileItem[]): Promise<void> {
    if (!this.pyodide) await this.initialize();
    const fs = this.pyodide.FS;

    for (const file of files) {
      if (file.isFolder) {
        const parts = file.path.split('/').filter(Boolean);
        let currPath = '';
        for (const part of parts) {
          currPath += '/' + part;
          try {
            if (!fs.analyzePath(currPath).exists) {
              fs.mkdir(currPath);
            }
          } catch {
            // ignore directory creation collisions
          }
        }
      } else {
        const parts = file.path.split('/').filter(Boolean);
        if (parts.length > 1) {
          let dirPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            dirPath += '/' + parts[i];
            try {
              if (!fs.analyzePath(dirPath).exists) {
                fs.mkdir(dirPath);
              }
            } catch {
              // ignore
            }
          }
        }

        try {
          fs.writeFile('/' + file.path, file.content, { encoding: 'utf8' });
          if (!file.path.startsWith('/')) {
            fs.writeFile(file.path, file.content, { encoding: 'utf8' });
          }
        } catch (e) {
          console.warn('Failed to sync file to Pyodide FS:', file.path, e);
        }
      }
    }
  }

  /**
   * Provide user input when terminal resolves input prompt
   */
  public submitUserInput(input: string) {
    if (this.currentStdinResolver) {
      const resolver = this.currentStdinResolver;
      this.currentStdinResolver = null;
      this.currentStdinRejecter = null;
      this.statusHandler('running', 'Running program...');
      resolver(input);
    }
  }

  /**
   * Execute Python code
   */
  public async execute(code: string, currentFile: string, allFiles: FileItem[]): Promise<void> {
    if (this.isExecuting) {
      this.stop();
    }

    try {
      this.isExecuting = true;
      this.statusHandler('running', `Running ${currentFile}...`);

      const pyodide = await this.initialize();
      await this.syncVirtualFiles(allFiles);

      // Save user globals dict or execute in clean scope
      const globals = pyodide.globals.get('dict')();
      globals.set('__name__', '__main__');
      globals.set('__file__', currentFile);

      // Check if code contains input() calls and needs AST transformation
      const prepResult = pyodide.runPython(`_prepare_and_run_code(${JSON.stringify(code)}, ${JSON.stringify(currentFile)})`);
      const mode = prepResult.get(0);

      if (mode === 'async') {
        const moduleAst = prepResult.get(1);
        const wrapperName = prepResult.get(2);

        // Compile and execute async wrapper
        pyodide.globals.set('__temp_ast_mod__', moduleAst);
        await pyodide.runPythonAsync(`
__compiled_code__ = compile(__temp_ast_mod__, ${JSON.stringify(currentFile)}, "exec")
exec(__compiled_code__, globals())
await ${wrapperName}()
`);
      } else {
        // Run standard code with Pyodide
        await pyodide.runPythonAsync(code, { globals });
      }

      this.isExecuting = false;
      this.statusHandler('success', 'Process finished with exit code 0');
    } catch (err: any) {
      this.isExecuting = false;
      let errMsg = err?.message || String(err);
      
      // Clean Pyodide internal wrapper frames from traceback if present
      if (errMsg.includes('Traceback (most recent call last):')) {
        // Keep the python traceback portion
        const tbIndex = errMsg.indexOf('Traceback (most recent call last):');
        errMsg = errMsg.substring(tbIndex);
      }
      
      this.stderrHandler(errMsg + '\n');
      this.statusHandler('error', 'Execution completed with error');
    } finally {
      this.currentStdinResolver = null;
      this.currentStdinRejecter = null;
    }
  }

  /**
   * Execute a single REPL command / expression
   */
  public async executeRepl(command: string): Promise<void> {
    const trimmed = command.trim();
    if (!trimmed) return;

    try {
      const pyodide = await this.initialize();
      this.stdoutHandler(`>>> ${command}\n`);
      
      try {
        // First try evaluating as an expression
        const result = await pyodide.runPythonAsync(`repr(eval(${JSON.stringify(trimmed)}))`);
        if (result && result !== 'None') {
          this.stdoutHandler(`${result}\n`);
        }
      } catch (evalErr) {
        // Fallback to exec statement
        await pyodide.runPythonAsync(trimmed);
      }
    } catch (err: any) {
      let errMsg = err?.message || String(err);
      if (errMsg.includes('Traceback (most recent call last):')) {
        const tbIndex = errMsg.indexOf('Traceback (most recent call last):');
        errMsg = errMsg.substring(tbIndex);
      }
      this.stderrHandler(errMsg + '\n');
    }
  }

  /**
   * Stop current execution
   */
  public stop() {
    if (this.currentStdinRejecter) {
      this.currentStdinRejecter(new Error('KeyboardInterrupt: Execution stopped by user'));
      this.currentStdinResolver = null;
      this.currentStdinRejecter = null;
    }
    if (this.isExecuting) {
      this.isExecuting = false;
      this.stderrHandler('\nKeyboardInterrupt: Program stopped by user.\n');
      this.statusHandler('stopped', 'Program execution stopped');
    }
  }

  public getIsRunning(): boolean {
    return this.isExecuting;
  }
}

export const pythonRunner = new PythonRunner();
