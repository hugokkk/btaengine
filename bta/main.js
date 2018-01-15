(function() {
  BTA = function(){
    this.canvas = null;
    this.shaders = [];
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.normalBuffer = null;
    this.textureBuffer = null;
    this.gl = null;
    this.frame = 0;
    this.fps = 30;
    this.updateLoop = null;
    this.updateBinder = [];
    this.world = [];
    this.onShadersLoad = ()=>{};
    this.camera = new camera();

    this.setCanvas = canvas => {
      this.canvas = canvas;
      this.canvas.width = $(window).width();
      this.canvas.height = $(window).height();
      this.gl = this.canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.vertexBuffer = this.gl.createBuffer();
      this.indexBuffer = this.gl.createBuffer();
      this.normalBuffer = this.gl.createBuffer();
      this.textureBuffer = this.gl.createBuffer();
      this.updateLoop = setInterval(() => this.update(), 1000/this.fps);
    }

    this.update = () => {
      this.frame += 1;
      this.updateBinder.forEach(update => {
        update(this);
      });
      this.drawScene();
    }

    this.addObject = obj => {
      this.world.push(obj);
    }

    this.bindUpdate = update => {
      this.updateBinder.push(update);
    }

    this.setBuffers = model => {
      if(!model.program){
        model.program = this.setProgram();  
      }
      let p = model.program;
      this.gl.useProgram(p);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(model.getVertexes()), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

      // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
      // this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(model.normals), this.gl.STATIC_DRAW);
      // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);

      let textureCoordinates = [];

      for(let i = 0; i < model.indexes.length/3; i += 1){
        textureCoordinates = [
          0.0,  0.0,
          1.0,  0.0,
          1.0,  1.0,
          0.0,  1.0
        ].concat(textureCoordinates)
      }

      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.getIndexes()), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    this.loadShader = (url, vertex) => {
      $.ajax(url, {complete: (data) => this.setShader(data.responseText, vertex)});
    }

    this.setShader = (shader, vertex) => {
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

    this.setProgram = () => {
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

    this.drawScene = () => {
      this.gl.clearColor(0.2, 0.3, 0.8, 0.8);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.world.forEach(obj => {
        obj.update(this);
        //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, obj.texture);

        let coord = this.gl.getAttribLocation(obj.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);

        let textureCoord = this.gl.getAttribLocation(obj.program, 'aTextureCoord');
        this.gl.vertexAttribPointer(textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(textureCoord);

        let uSampler = this.gl.getUniformLocation(obj.program, 'uSampler');
        this.gl.uniform1i(uSampler, 0);

        // let normals = this.gl.getAttribLocation(obj.program, "normals");
        // this.gl.vertexAttribPointer(normals, 3, this.gl.FLOAT, false, 0, 0);
        // this.gl.enableVertexAttribArray(normals);

        // let lightDir = this.gl.getUniformLocation(obj.program, "lightDir");
        // this.gl.uniform3f(lightDir, this.camera.dir.x, this.camera.dir.y, this.camera.dir.z);

        this.gl.drawElements(this.gl.TRIANGLES, obj.indexes.length, this.gl.UNSIGNED_SHORT, 0);  
      });
    }
  }

  this.model = function(){
    this.vertexes = [];
    this.indexes = [];
    this.pos = new vector();
    this.scale = new vector(0.2, 0.2, 0.2);
    this.rot = new vector();
    this.program;
    this.normals;
    this.texture;
    this.onLoad = ()=>{};

    this.loadObj = url => {
      $.ajax(url, {complete: data => {
        this.readObj(data.responseText);
        this.generateNormals();
        this.onLoad();
      }});
    }

    this.getVertexes = camera => {
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
        // APPLY PROJECTION
        if(camera){
          let p = camera.projectVector(new vector(v[i+0], v[i+1], v[i+2]));
          v[i+0] = p.x;
          v[i+1] = p.y;
          v[i+2] = p.z;
        }
      }
      return v;
    }

    this.getIndexes = () => {
      return this.indexes;
    }

    this.generateNormals = () => {
      this.normals = [];
      for(let i = 0; i < this.indexes.length; i += 3){
        let a = new vector(
          this.vertexes[(this.indexes[i+0]*3)+0],
          this.vertexes[(this.indexes[i+0]*3)+1],
          this.vertexes[(this.indexes[i+0]*3)+2]
        );
        let b = new vector(
          this.vertexes[(this.indexes[i+1]*3)+0],
          this.vertexes[(this.indexes[i+1]*3)+1],
          this.vertexes[(this.indexes[i+1]*3)+2]
        );
        let c = new vector(
          this.vertexes[(this.indexes[i+2]*3)+0],
          this.vertexes[(this.indexes[i+2]*3)+1],
          this.vertexes[(this.indexes[i+2]*3)+2]
        );
        let v = a.subtract(b).cross(c.subtract(b)).normalize();
        this.normals.push(v.x);
        this.normals.push(v.y);
        this.normals.push(v.z);
      }
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

    this.loadTexture = (url, gl) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    width, height, border, srcFormat, srcType,
                    pixel);
    
      const image = new Image();
      var that = this;
      image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        console.log("Loaded texture");

        if (that.isPowerOf2(image.width) && that.isPowerOf2(image.height)) {
          console.log("Is power of 2!");
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          console.log("Isn't power of 2!");
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
      };
      image.src = url;
    
      this.texture = texture;
      console.log(this.texture);
    }

    this.isPowerOf2 = value => {
      return (value & (value - 1)) == 0;
    }
  }

  this.vector = function(x, y, z){
    this.x = x||0;
    this.y = y||0;
    this.z = z||0;

    this.add = v => {
      let ret = new vector(this.x, this.y, this.z);
      ret.x += v.x;
      ret.y += v.y;
      ret.z += v.z;
      return ret;
    }

    this.subtract = v => {
      let ret = new vector(this.x, this.y, this.z);
      ret.x -= v.x;
      ret.y -= v.y;
      ret.z -= v.z;
      return ret;
    }

    this.multiply = e => {
      let ret = new vector(this.x, this.y, this.z);
      ret.x *= e;
      ret.y *= e;
      ret.z *= e;
      return ret;
    }
    
    this.cross = v => {
      let ret = new vector();
      ret.x = (this.y*v.z)-(this.z*v.y);
      ret.y = (this.z*v.x)-(this.x*v.z);
      ret.z = (this.x*v.y)-(this.y*v.x);
      return ret;
    }

    this.magnitude = () => {
      return Math.sqrt(Math.pow(this.x, 2)+Math.pow(this.y, 2)+Math.pow(this.z, 2));
    }

    this.normalize = norm => {
      let n = norm||1;
      let v = new vector(this.x, this.y, this.z);
      let m = v.magnitude();
      v = v.multiply(n/m);
      return v;
    }
  }

  camera = function(){
    this.pos = new vector();
    this.dir = new vector(0, 0, 1);
    this.perspectiveAngle = Math.PI/2;
    this.ratio = 1;

    this.projectVector = v => {
      let relativePos = v.subtract(this.pos);
      let teta = Math.atan2(relativePos.x, relativePos.z);
      let azimut = Math.atan2(relativePos.x, relativePos.y);
      let ang = (this.perspectiveAngle/2)/Math.PI;
      let projectedPos = new vector(Math.cos(teta)/ang, Math.cos(azimut)/ang, v.z);
      return projectedPos;
    }
  }
}());