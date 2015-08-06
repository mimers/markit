function Positon(x, y) {
    this.copy = function(pos) {
        this.x = pos.x;
        this.y = pos.y;
        this.updateControl();
    }
    this.update = function(x, y) {
        this.x = x;
        this.y = y;
        this.updateControl();
    }
    this.translate = function(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.updateControl();
    }
    this.setElement = function(elem) {
        this.control = elem;
    }
    this.updateControl = function () {
        if (this.control != null) {
            this.control.style.transform = "translate("+this.x+"px,"+this.y+"px)";
            // this.control.style.left = this.x;
            // this.control.style.top = this.y;
        };
    }
    this.update(x, y);
    return this;
}
function Point(x, y) {
    this.x = x;
    this.y = y;
    this.distanceTo = function(p) {
        return Math.sqrt((p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y));
    }
    this.draw = function(ctx, vertical, dash) {
        var mark_x = this.x,
            mark_y = this.y;
        var dst_x = this.x,
            dst_y = this.y;
        var offset_x = mark_handle_half_size,
            offset_y = mark_handle_half_size;
        if (dash) {
            offset_x = mark_layer.width;
            offset_y = mark_layer.height;
        };
        if (vertical) {
            mark_x = this.x - offset_x;
            dst_x = this.x + offset_x;
        } else {
            mark_y = this.y - offset_y;
            dst_y = this.y + offset_y;
        }
        if (dash) {
            ctx.save();
            ctx.setLineDash([4, 4]);
        }
        ctx.beginPath();
        ctx.moveTo(mark_x, mark_y);
        ctx.lineTo(dst_x, dst_y);
        ctx.stroke();
        if (dash) {
            ctx.restore();
        }
    }
}

function LineMark(start, end) {
    this.start = start;
    this.end = end;
    this._cache_length = null;
    this.length = function() {
        if (this == current_mark) {
            this._cache_length = this.start.distanceTo(this.end) + 1;
        }
        return this._cache_length;
    }
    this.isVertical = function() {
        return this.end.x == this.start.x;
    }
    this.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        this.start.draw(ctx, this.isVertical(), this == current_mark);
        this.end.draw(ctx, this.isVertical(), this == current_mark);
        var text = "" + Math.floor(this.length());
        var center_x = (this.start.x + this.end.x) / 2;
        var center_y = (this.start.y + this.end.y) / 2;
        paint_text(text, center_x, center_y, ctx);
    }
}

function ColorMark(position, color, lable) {
    this.color = color;
    this.position = position;
    this.lable = lable;
    this.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.lable.x, this.lable.y);
        ctx.stroke();
        ctx.save();
        ctx.textBaseline = (this.lable.y > this.position.y)?"top":"bottom";
        paint_text(this.color, this.lable.x, this.lable.y, ctx);
        ctx.restore();
    }
}