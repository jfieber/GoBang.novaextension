var langserver = null;

const goEnv = {
  GOPATH: nova.path.join(nova.extension.globalStoragePath, "go"),
  PATH: [
    nova.path.join(nova.extension.globalStoragePath, "go", "bin"),
    nova.environment["PATH"],
  ].join(":"),
};
const goplsPath = nova.path.join(goEnv.GOPATH, "bin", "gopls");

// This drops a private install of go and gopls inside
// nova.extension.globalStoragePath.
function bootstrap() {
  let execLog = (result) => {
    console.log("bootstrap status:", result.status);
    result.stdout.length > 0 &&
      console.log("bootstrap stdout\n", result.stdout.join("\n "));
    result.stderr.length > 0 &&
      console.log("bootstrap stderr\n", result.stderr.join("\n "));
  };
  return novaExec(nova.path.join(nova.extension.path, "bootstrap"), {
    env: goEnv,
  })
    .then(execLog)
    .catch(execLog);
}

exports.activate = function () {
  // Do work when the extension is activated

  bootstrap().then(() => {
    console.log("Starting language server");
    langserver = new ExampleLanguageServer();
  });
};

exports.deactivate = function () {
  // Clean up state before the extension is deactivated
  if (langserver) {
    langserver.deactivate();
    langserver = null;
  }
};

class ExampleLanguageServer {
  constructor() {
    // Observe the configuration setting for the server's location, and restart the server on change
    this.start(goplsPath);
  }

  deactivate() {
    this.stop();
  }

  start(path) {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
    }

    // Create the client
    var serverOptions = {
      path: path,
      args: [
        "serve",
        "-rpc.trace",
        "-logfile",
        nova.path.join(nova.extension.globalStoragePath, "gopls.log"),
      ],
    };
    var clientOptions = {
      // The set of document syntaxes for which the server is valid
      syntaxes: ["go"],
    };
    var client = new LanguageClient(
      "gopls",
      "gopls",
      serverOptions,
      clientOptions
    );

    try {
      // Start the client
      client.start();

      // Add the client to the subscriptions to be cleaned up
      nova.subscriptions.add(client);
      this.languageClient = client;
    } catch (err) {
      // If the .start() method throws, it's likely because the path to the language server is invalid

      if (nova.inDevMode()) {
        console.error(err);
      }
    }
  }

  stop() {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
      this.languageClient = null;
    }
  }
}

//
// Execute a command, with options as per the Nova Process API
// and return an promise resolving/rejecting to an object:
//
// {
//   status: number,
//   stdout: string[],
//   stderr: string[]
// }
//
function novaExec(command, options) {
  return new Promise((resolve, reject) => {
    let retVal = {
      status: 0,
      stdout: [],
      stderr: [],
    };
    let cmd = new Process(command, options || {});
    cmd.onStdout((l) => {
      retVal.stdout.push(l.trim());
    });
    cmd.onStderr((l) => {
      retVal.stderr.push(l.trim());
    });
    cmd.onDidExit((status) => {
      retVal.status = status;
      if (status === 0) {
        resolve(retVal);
      } else {
        reject(retVal);
      }
    });
    try {
      cmd.start();
    } catch (e) {
      retVal.status = 128;
      retVal.stderr = [e.message];
      reject(retVal);
    }
  });
}
