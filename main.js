var bta, model1, model2;

$(document).ready(function(){
  bta = new BTA();
  bta.setCanvas($("#mainStage")[0]);
  bta.loadShader("bta/shader_2d", true);
  bta.loadShader("bta/frag_2d", false);
  bta.onShadersLoad = () =>{
    model1 = new model();
    model1.loadObj("bta/cube.obj");
    model1.loadTexture("images/sample_character.png", bta.gl);
    model1.onLoad = () => {
      model1.pos.x = 0;
      model1.pos.y = 0;
      bta.addObject(model1);
    };
    bta.bindUpdate(update);
  };
});

function update(bta){
  model1.rot.x += 0.1;
  model1.rot.y += 0.15;
}