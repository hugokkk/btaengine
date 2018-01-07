$(document).ready(function(){
  var bta = new BTA();
  bta.setCanvas($("#mainStage")[0]);
  $.ajax("bta/shader", {complete: (data) => bta.setShader(data.responseText, true)});
  $.ajax("bta/frag", {complete: (data) => bta.setShader(data.responseText, false)});
  setTimeout(() => {
    bta.setProgram();
    setInterval(() => bta.update(), 1000/30);
  }, 1000);
});