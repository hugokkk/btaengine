(function() {
  this.BTA = function(){
    this.canvas = null;
    this.shaders = [];
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.gl = null;
    this.frame = 0;
    this.fps = 30;
    this.updateLoop = null;
    this.updateBinder = [];
    this.world = [];
    this.onShadersLoad = ()=>{};;

    this.setCanvas = function(canvas){
      this.canvas = canvas;
      this.canvas.width = $(window).width();
      this.canvas.height = $(window).height();
      this.gl = this.canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.vertexBuffer = this.gl.createBuffer();
      this.indexBuffer = this.gl.createBuffer();
      this.updateLoop = setInterval(() => this.update(), 1000/this.fps);
    }

    this.update = function(){
      this.frame += 1;
      this.updateBinder.forEach(update => {
        update(this);
      });
      this.world.forEach(obj => {
        obj.update(this);
      });
      this.drawScene();
    }

    this.addObject = obj => {
      this.world.push(obj);
    }

    this.bindUpdate = update => {
      this.updateBinder.push(update);
    }

    this.setBuffers = function(model){
      if(!model.program){
        model.program = this.setProgram();  
      }
      let p = model.program;
      this.gl.useProgram(p);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(model.getVertexes()), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.getIndexes()), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    this.loadShader = (url, vertex) => {
      $.ajax(url, {complete: (data) => this.setShader(data.responseText, vertex)});
    }

    this.setShader = function(shader, vertex){
      let t = (vertex)?this.gl.VERTEX_SHADER:this.gl.FRAGMENT_SHADER;
      let s = this.gl.createShader(t);
      this.gl.shaderSource(s, shader);
      this.gl.compileShader(s);
      if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
        let info = this.gl.getShaderInfoLog(s);
        throw 'Could not compile WebGL shader. \n\n' + info;
      }
      this.shaders.push(s);
      if(this.shaders.length == 2)this.onShadersLoad();
    }

    this.setProgram = function(){
      let program = this.gl.createProgram();
      this.shaders.forEach(shader => {
        this.gl.attachShader(program, shader);
      });
      this.gl.linkProgram(program);
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        let info = this.gl.getProgramInfoLog(program);
        throw 'Could not compile WebGL program. \n\n' + info;
      }
      return program;
    }

    this.drawScene = function(){
      this.gl.clearColor(0.2, 0.3, 0.8, 0.8);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.world.forEach(obj => {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        let coord = this.gl.getAttribLocation(obj.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);
        this.gl.drawElements(this.gl.TRIANGLES, obj.indexes.length, this.gl.UNSIGNED_SHORT, 0);  
      });
    }

    this.model = function(bta){
      this.vertexes = [];
      this.indexes = [];
      this.pos = new bta.vector();
      this.scale = new bta.vector(0.2, 0.2, 0.2);
      this.rot = new bta.vector();
      this.program;
      this.onLoad = ()=>{};

      this.loadObj = url => {
        $.ajax(url, {complete: data => {
          this.readObj(data.responseText);
          this.onLoad();
        }});
      }

      this.getVertexes = () => {
        while(this.rot.x >= Math.PI*2){
          this.rot.x -= Math.PI*2;
        }
        while(this.rot.x <= -Math.PI){
          this.rot.x += Math.PI*2;
        }
        while(this.rot.y >= Math.PI){
          this.rot.y -= Math.PI*2;
        }
        while(this.rot.y <= -Math.PI){
          this.rot.y += Math.PI*2;
        }
        while(this.rot.z >= Math.PI){
          this.rot.z -= Math.PI*2;
        }
        while(this.rot.z <= -Math.PI){
          this.rot.z += Math.PI*2;
        }
        let v = [].concat(this.vertexes);
        for(let i = 0; i < v.length; i += 3){
          // APPLY SCALE
          v[i+0] *= this.scale.x;
          v[i+1] *= this.scale.y;
          v[i+2] *= this.scale.z;
          // APPLY ROTATION
          let d, ang;
          // ROTATION X
          d = Math.sqrt(Math.pow(v[i+1], 2) + Math.pow(v[i+2], 2));
          ang = Math.atan2(v[i+1], v[i+2]);
          ang += this.rot.x;
          v[i+1] = d*Math.cos(ang);
          v[i+2] = d*Math.sin(ang);
          // ROTATION Y
          d = Math.sqrt(Math.pow(v[i+2], 2) + Math.pow(v[i+0], 2));
          ang = Math.atan2(v[i+0], v[i+2]);
          ang += this.rot.y;
          v[i+2] = d*Math.cos(ang);
          v[i+0] = d*Math.sin(ang);
          // ROTATION Z
          d = Math.sqrt(Math.pow(v[i+1], 2) + Math.pow(v[i+0], 2));
          ang = Math.atan2(v[i+0], v[i+1]);
          ang += this.rot.z;
          v[i+1] = d*Math.cos(ang);
          v[i+0] = d*Math.sin(ang);
          // APPLY POSITION
          v[i+0] += this.pos.x;
          v[i+1] += this.pos.y;
          v[i+2] += this.pos.z;
        }
        return v;
      }

      this.getIndexes = () => {
        return this.indexes;
      }

      this.update = bta => {
        bta.setBuffers(this);
      }

      this.readObj = data => {
        this.vertexes = [];
        this.indexes = [];
        let lines = data.split("\n");
        lines.forEach(line => {
          if(line.substring(0, 2) == "v "){
            line.substring(2).split(" ").forEach(value => {
              this.vertexes.push(Number(value));
            });
          }else if(line.substring(0, 2) == "f "){
            line.substring(2).split(" ").forEach(value => {
              this.indexes.push(Number(value.split("//")[0])-1);
            });
          }
        });
      }
    }

    this.vector = function(x, y, z){
      this.x = x||0;
      this.y = y||0;
      this.z = z||0;

      this.add = v => {
        let ret = new BTA.vector(this.x, this.y, this.z);
        ret.x += v.x;
        ret.y += v.y;
        ret.z += v.z;
        return ret;
      }
      
      this.cross = v => {
        let ret = new BTA.vector();
        ret.x = (this.y*v.z)-(this.z*v.y);
        ret.y = (this.z*v.x)-(this.x*v.z);
        ret.z = (this.x*v.y)-(this.y*v.x);
        return ret;
      }
    }
  }
}());