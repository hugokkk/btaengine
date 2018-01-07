(function() {
  this.BTA = function(){
    this.canvas = null;
    this.shaders = [];
    this.program = null;
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.gl = null;
    this.frame = 0;

    this.vertices = [
      0.5,0.5,0.0,
      -0.5,0.5,0.0,
      -0.5,-0.5,0.0,
      0.5,-0.5,0.0, 
    ];
   
    this.indices = [
      0,1,2,
      0,2,3
    ];

    this.setCanvas = function(canvas){
      this.canvas = canvas;
      this.canvas.width = $(window).width();
      this.canvas.height = $(window).height();
      this.gl = this.canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.setBuffers();
    }

    this.update = function(){
      this.frame += 1;
      // this.vertices = [
      //   0.5,0.5,0.0,
      //   -0.5,0.5,0.0,
      //   Math.cos((this.frame/30)+Math.PI)/2,-0.5,Math.sin(this.frame/30)/2,
      //   Math.cos(this.frame/30)/2,-0.5,Math.sin((this.frame/30)+Math.PI)/2,
      // ];
      this.setBuffers();
      this.drawScene();
    }

    this.setBuffers = function(){
      this.vertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

      this.indexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    this.setShader = function(shader, type){
      let t = (type)?this.gl.VERTEX_SHADER:this.gl.FRAGMENT_SHADER;
      let s = this.gl.createShader(t);
      this.gl.shaderSource(s, shader);
      this.gl.compileShader(s);
      if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
        let info = this.gl.getShaderInfoLog(s);
        throw 'Could not compile WebGL shader. \n\n' + info;
      }
      this.shaders.push(s);
    }

    this.setProgram = function(){
      this.program = this.gl.createProgram();
      this.shaders.forEach(shader => {
        this.gl.attachShader(this.program, shader);
      });
      this.gl.linkProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        let info = this.gl.getProgramInfoLog(this.program);
        throw 'Could not compile WebGL program. \n\n' + info;
      }
      this.gl.useProgram(this.program);
    }

    this.drawScene = function(){
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      let coord = this.gl.getAttribLocation(this.program, "coordinates");
      this.gl.vertexAttribPointer(coord, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(coord);

      this.gl.clearColor(0.2, 0.3, 0.8, 0.5);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
      this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);      
    }
  }
}());