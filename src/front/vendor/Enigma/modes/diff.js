
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/enigma"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/enigma"], mod);
  else // Plain browser env
    mod(Enigma);
})(function(Enigma) {
"use strict";

Enigma.defineMode("diff", function() {

  var TOKEN_NAMES = {
    '+': 'positive',
    '-': 'negative',
    '@': 'meta'
  };

  return {
    token: function(stream) {
      var tw_pos = stream.string.search(/[\t ]+?$/);

      if (!stream.sol() || tw_pos === 0) {
        stream.skipToEnd();
        return ("error " + (
          TOKEN_NAMES[stream.string.charAt(0)] || '')).replace(/ $/, '');
      }

      var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

      if (tw_pos === -1) {
        stream.skipToEnd();
      } else {
        stream.pos = tw_pos;
      }

      return token_name;
    }
  };
});

Enigma.defineMIME("text/x-diff", "diff");

});
