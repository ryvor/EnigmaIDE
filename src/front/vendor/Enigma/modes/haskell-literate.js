
(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/enigma"), require("../haskell/haskell"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/enigma", "../haskell/haskell"], mod)
  else // Plain browser env
    mod(Enigma)
})(function (Enigma) {
  "use strict"

  Enigma.defineMode("haskell-literate", function (config, parserConfig) {
    var baseMode = Enigma.getMode(config, (parserConfig && parserConfig.base) || "haskell")

    return {
      startState: function () {
        return {
          inCode: false,
          baseState: Enigma.startState(baseMode)
        }
      },
      token: function (stream, state) {
        if (stream.sol()) {
          if (state.inCode = stream.eat(">"))
            return "meta"
        }
        if (state.inCode) {
          return baseMode.token(stream, state.baseState)
        } else {
          stream.skipToEnd()
          return "comment"
        }
      },
      innerMode: function (state) {
        return state.inCode ? {state: state.baseState, mode: baseMode} : null
      }
    }
  }, "haskell")

  Enigma.defineMIME("text/x-literate-haskell", "haskell-literate")
});
