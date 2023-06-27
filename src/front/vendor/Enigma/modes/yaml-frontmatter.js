(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/enigma"), require("../yaml/yaml"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/enigma", "../yaml/yaml"], mod)
  else // Plain browser env
    mod(Enigma)
})(function (Enigma) {

  var START = 0, FRONTMATTER = 1, BODY = 2

  // a mixed mode for Markdown text with an optional YAML front matter
  Enigma.defineMode("yaml-frontmatter", function (config, parserConfig) {
    var yamlMode = Enigma.getMode(config, "yaml")
    var innerMode = Enigma.getMode(config, parserConfig && parserConfig.base || "gfm")

    function localMode(state) {
      return state.state == FRONTMATTER ? {mode: yamlMode, state: state.yaml} : {mode: innerMode, state: state.inner}
    }

    return {
      startState: function () {
        return {
          state: START,
          yaml: null,
          inner: Enigma.startState(innerMode)
        }
      },
      copyState: function (state) {
        return {
          state: state.state,
          yaml: state.yaml && Enigma.copyState(yamlMode, state.yaml),
          inner: Enigma.copyState(innerMode, state.inner)
        }
      },
      token: function (stream, state) {
        if (state.state == START) {
          if (stream.match('---', false)) {
            state.state = FRONTMATTER
            state.yaml = Enigma.startState(yamlMode)
            return yamlMode.token(stream, state.yaml)
          } else {
            state.state = BODY
            return innerMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/(---|\.\.\.)/, false)
          var style = yamlMode.token(stream, state.yaml)
          if (end) {
            state.state = BODY
            state.yaml = null
          }
          return style
        } else {
          return innerMode.token(stream, state.inner)
        }
      },
      innerMode: localMode,
      indent: function(state, a, b) {
        var m = localMode(state)
        return m.mode.indent ? m.mode.indent(m.state, a, b) : Enigma.Pass
      },
      blankLine: function (state) {
        var m = localMode(state)
        if (m.mode.blankLine) return m.mode.blankLine(m.state)
      }
    }
  })
});
