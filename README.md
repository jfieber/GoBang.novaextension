**GoBang** is a self-contained repro case for the [Go "gopls" language server](https://github.com/golang/tools/blob/master/gopls/doc/user.md) causing Nova 3.0 to crash. There may well be incorrect behavior of gopls going on here, but having Nova vaporize is not a good user experience.

1. Open the extension for editing.
2. Ensure that the Language Servers _Code actions indicator_ option is enabled in _Preferences_ → _Editor_ → _Syntax_.
3. _Extensions_ → _Activate Project as Extension_. This will do a private-to-the-extension `go` and `gopls` install in `nova.extension.globalStoragePath`. For convenience, it will also pop open the install folder in Finder. See [bootstrap](bootstrap) for details on that. The install will take a minute or so, so watch the extension console log. It will confirm the install by reporting the `go` and `gopls` version and a `gopls.log` file should show up in `nova.extension.globalStoragePath`, which contains an RPC log.
4. Open [main.go](main.go). Make sure the syntax is set to Go. This file has an error—it is missing the `import fmt` statement—which the language server offers to fix with an "Organize Imports" codeAction.
5. Move the cursor to the end of the file. Crash. The last event in the `gopls.log` is a `textDocument/codeAction` request and response.
