var bta, model1, model2;

$(document).ready(function(){
  bta = new BTA();
  bta.setCanvas($("#mainStage")[0]);
  bta.loadShader("bta/shader", true);
  bta.loadShader("bta/frag", false);
  bta.onShadersLoad = () =>{
    model1 = new model();
    model1.loadObj("bta/cube.obj");
    model1.onLoad = () => {
      model1.pos.x = 5;
      model1.pos.y = 0;
      bta.addObject(model1);
    };
    /*model2 = new model();
    model2.loadObj("bta/cube.obj");
    model2.onLoad = () => {
      model2.pos.x = 0;
      model2.pos.y = 0;
      bta.addObject(model2);
    };*/
    bta.bindUpdate(update);
  };
});

function update(bta){
  model1.pos.y = Math.cos(bta.frame/90)/2;
  model1.pos.z = Math.sin(bta.frame/90)/2;
  model1.rot.y += 1/6;
}