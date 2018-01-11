var bta, model1, model2;

$(document).ready(function(){
  bta = new BTA();
  bta.setCanvas($("#mainStage")[0]);
  bta.loadShader("bta/shader", true);
  bta.loadShader("bta/frag", false);
  bta.onShadersLoad = () =>{
    model1 = new bta.model(bta);
    model1.loadObj("bta/cube.obj");
    model1.onLoad = () => {
      model1.pos.x = -0.5;
      model1.pos.y = -0.5;
      bta.addObject(model1);
    };
    /*model2 = new bta.model(bta);
    model2.loadObj("bta/cube.obj");
    model2.onLoad = () => {
      model2.pos.x = 0.5;
      model2.pos.y = 0.5;
      bta.addObject(model2);
    };*/
    bta.bindUpdate(update);
  };
});

function update(){
  //model.rot.z += 1/180;
}