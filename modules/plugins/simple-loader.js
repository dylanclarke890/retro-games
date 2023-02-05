ig.module(
    'plugins.preloader'
)
.requires(
    'impact.loader'
)
.defines(function(){

PreLoader = ig.Loader.extend({
    imageObj:null,
    init: function( gameClass, resources ) {
        this.imageObj = new Image();
        this.imageObj.src = 'media/main_loader.png';
        this.parent(gameClass, resources);

    },

    draw: function() {
        // Add your drawing code here
        var ctx = ig.system.context;
        ctx.drawImage(this.imageObj, 0, 0);

     
        this._drawStatus += (this.status - this._drawStatus)/5;
        var s = ig.system.scale;
        var w = ig.system.width * 0.6;
        var h = ig.system.height * 0.03;
        var x = ig.system.width * 0.5-w/2;
        var y = ig.system.height * 0.85-h/2;
        
        
        ig.system.context.fillStyle = '#fff)';
        ig.system.context.fillRect( x*s, y*s, w*s, h*s );
        
        ig.system.context.fillStyle = '#000';
        ig.system.context.fillRect( x*s+s, y*s+s, w*s-s-s, h*s-s-s );
        
        ig.system.context.fillStyle = '#fff';
        ig.system.context.fillRect( x*s, y*s, w*s*this._drawStatus, h*s );


    }
});