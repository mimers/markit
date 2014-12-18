var root = document.getElementById('root');
var mark_lines = [];
var current_line = null;
var need_paint = false;
var new_line_count = 0;

function invalidate(){
    need_paint = true;
}

function Point(x, y){
    this.x = x;
    this.y = y;
    this.distanceTo = function(p){
        return Math.sqrt((p.x-this.x)*(p.x-this.x) + (p.y-this.y)*(p.y-this.y));
    }
    this.radius = 5;
    this.draw = function(ctx){
        ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.stroke();
    }
}

function LineMark(start, end){
    this.start = start;
    this.end = end;
    this._cache_length = null;
    this.length = function(){
        if(true){
            this._cache_length = this.start.distanceTo(this.end);
        }
        return this._cache_length;
    }
    this.draw = function(ctx){
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        var dst_x, dst_y;
        var abs_x = Math.abs(this.end.x - this.start.x);
        var abs_y = Math.abs(this.end.y - this.start.y);
        if(abs_x < abs_y){
        	dst_x = this.start.x;
        	dst_y = this.end.y;
        } else {
        	dst_x = this.end.x;
        	dst_y = this.start.y;
        }
        ctx.lineTo(dst_x, dst_y);
        ctx.stroke();
        this.start.draw(ctx);
        
        ctx.beginPath();
		ctx.arc(dst_x, dst_y, 5, 0, Math.PI * 2, true);
		ctx.fill();
		var text = ""+Math.floor(this.length());
		var measure = ctx.measureText(text);
		var text_size = 0, text_x, text_y;
		if(dst_x == this.start.x){
			text_size = 20;
			text_x = dst_x - measure.width/2;
			text_y = (dst_y - this.start.y)/2 + this.start.y;
		} else {
			text_size = measure.width;
			text_x = (dst_x - this.start.x)/2 + this.start.x;
			text_y = dst_y - 20/2;
		}
		ctx.fillText(text, text_x, text_y);
    }
}

function render(){
    if(!need_paint){
        return;
    }
    var ctx = root.getContext('2d');
    ctx.fillStyle  = "white";
    ctx.fillRect(0, 0, root.width, root.height);
    ctx.strokeStyle = "black";
    ctx.fillStyle = "red"; 
    for(var i in mark_lines){
        mark_lines[i].draw(ctx);
    }
    if(current_line != null){
        current_line.draw(ctx);
    }
    need_paint = false;
}

root.onmousedown = function(event){
    current_line = new LineMark(new Point(event.layerX, event.layerY),new Point(event.layerX, event.layerY));
    new_line_count = 0;
    invalidate();
}

root.onmouseup = function(event){
    if(current_line != null && new_line_count == 1){
        ended_point = new Point(event.layerX, event.layerY);
        current_line.end = ended_point;
        mark_lines[mark_lines.length] = current_line
        invalidate();
    }
    current_line = null;
}

root.onmousemove = function(event){
    if(current_line != null){
        current_line.end.x = event.layerX;
        current_line.end.y = event.layerY;
        new_line_count = 1;
        invalidate();
    }
}

setInterval(render, 15);