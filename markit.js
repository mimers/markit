var MARK_MODE = {
    'LINE': 0,
    'COLOR': 1,
    'RECT': 2
}
var root = document.getElementById('root');
var mode_name = document.getElementById('mode-name');
var mark_lines = [];
var current_mark = null;
var need_paint = true;
var new_line_count = 0;
var background_image = new Image();
var font_size = 20;
var font_style = "18px mono";
var mark_handle_half_size = 6;
var cursor_pos = new Point(0, 0);
var edit_file_name;
var mark_mode = MARK_MODE.LINE;
var mouse_handers = [];

function invalidate() {
    need_paint = true;
}

function paint_text(text, x, y, ctx) {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.restore();
    ctx.fillText(text, x, y);
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
            offset_x = root.width;
            offset_y = root.height;
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

function render() {
    if (!need_paint) {
        return;
    }
    var ctx = root.getContext('2d');
    ctx.fillStyle = "white";
    ctx.font = font_style;
    ctx.lineWidth = 0.5;
    ctx.clearRect(0, 0, root.width, root.height);
    if (background_image.src) {
        ctx.drawImage(background_image, 0, 0);
    };
    ctx.strokeStyle = "red";
    ctx.fillStyle = "red";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(0.5, 0.5);
    for (var i in mark_lines) {
        mark_lines[i].draw(ctx);
    }
    if (current_mark != null) {
        current_mark.draw(ctx);
    } else {
        // draw cursor
        mouse_handers[mark_mode].drawcursor(ctx);
    }
    if (!background_image.src) {
        var tf = ctx.font;
        ctx.font = '120px serif';
        ctx.fillText("Drop image here!", root.width / 2, root.height / 2);
        ctx.font = tf;
    };
    ctx.restore();
    need_paint = false;
}

function adjustLineDirection(line) {
    var dst_x, dst_y;
    var abs_x = Math.abs(line.end.x - line.start.x);
    var abs_y = Math.abs(line.end.y - line.start.y);
    if (abs_x < abs_y) {
        // vertical mode
        dst_x = line.start.x;
        dst_y = line.end.y;
    } else {
        // horizonal mode
        dst_x = line.end.x;
        dst_y = line.start.y;
    }
    line.end.x = dst_x;
    line.end.y = dst_y;
}

function adjustColorMarkDirection(line) {
    var delta_x = line.lable.x - line.position.x;
    var delta_y = line.lable.y - line.position.y;
    var same_sign = (delta_y > 0) == (delta_x > 0);
    if (same_sign) {
        var origin_sign = (delta_x > 0) ? 1 : -1;
        delta_y = origin_sign * Math.min(Math.abs(delta_x), Math.abs(delta_y));
        delta_x = delta_y;
    } else {
        if (delta_y > 0) {
            delta_y = Math.min(delta_y, -delta_x);
            delta_x = -delta_y;
        } else {
            delta_y = -Math.min(-delta_y, delta_x);
            delta_x = -delta_y;
        }
    }
    line.lable.x = line.position.x + delta_x;
    line.lable.y = line.position.y + delta_y;
}

function LineModeHandler() {
    this.onmousedown = function(event) {
        if (event.which != 1) {
            return;
        }
        current_mark = new LineMark(new Point(Math.floor(event.layerX), Math.floor(event.layerY)),
            new Point(Math.floor(event.layerX), Math.floor(event.layerY)));
        new_line_count = 0;
        invalidate();
    }
    this.onmouseup = function(event) {
        if (event.which != 1) {
            return;
        }
        if (current_mark != null && new_line_count == 1) {
            var pix_x = Math.floor(event.layerX);
            var pix_y = Math.floor(event.layerY);
            current_mark.end.x = Math.floor(pix_x);
            current_mark.end.y = Math.floor(pix_y);
            adjustLineDirection(current_mark);
            if (current_mark.length() > 0) {
                mark_lines[mark_lines.length] = current_mark;
            }
        }
        current_mark = null;
        cursor_pos.x = pix_x;
        cursor_pos.y = pix_y;
        invalidate();
    }
    this.onmousemove = function(event) {
        if (event.which != 1 && current_mark != null) {
            return;
        }
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        if (current_mark != null) {
            current_mark.end.x = pix_x;
            current_mark.end.y = pix_y;
            adjustLineDirection(current_mark);
            new_line_count = 1;
        } else if (cursor_pos.x != pix_x || cursor_pos.y != pix_y) {
            cursor_pos.x = pix_x;
            cursor_pos.y = pix_y;
        }
        invalidate();
    }
    this.drawcursor = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(cursor_pos.x - mark_handle_half_size, cursor_pos.y);
        ctx.lineTo(cursor_pos.x + mark_handle_half_size, cursor_pos.y);
        ctx.moveTo(cursor_pos.x, cursor_pos.y - mark_handle_half_size);
        ctx.lineTo(cursor_pos.x, cursor_pos.y + mark_handle_half_size);
        ctx.stroke(); 
    }
}

function ColorModeHandler() {
    this.onmousedown = function(event) {
        if (event.which != 1) {
            return;
        }
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        var ctx = root.getContext("2d");
        var data = ctx.getImageData(pix_x, pix_y, 1, 1).data;
        var color_str = "rgba(" + data[0] + "," + data[1] + "," + data[2] + ","+data[3]+")";
        current_mark = new ColorMark(new Point(pix_x, pix_y), color_str, new Point(pix_x + 1, pix_y + 1));
        new_line_count = 0;
        invalidate();
    }
    this.onmousemove = function(event) {
        if (event.which != 1 && current_mark != null) {
            return;
        }
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        if (current_mark == null) {
            // update cursor position
            cursor_pos.x = pix_x;
            cursor_pos.y = pix_y;
        } else {
            current_mark.lable.x = pix_x;
            current_mark.lable.y = pix_y;
            adjustColorMarkDirection(current_mark);
            new_line_count = 1;
        }
        invalidate();
    }
    this.onmouseup = function(event) {
        if (event.which != 1) {
            return;
        }
        if (current_mark != null && new_line_count == 1) {
            mark_lines[mark_lines.length] = current_mark;
        }
        current_mark = null;
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        cursor_pos.x = pix_x;
        cursor_pos.y = pix_y;
        invalidate();
    }
    this.drawcursor = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(cursor_pos.x - mark_handle_half_size, cursor_pos.y);
        ctx.lineTo(cursor_pos.x-2, cursor_pos.y);
        ctx.moveTo(cursor_pos.x + 2, cursor_pos.y);
        ctx.lineTo(cursor_pos.x +  + mark_handle_half_size, cursor_pos.y);
        ctx.moveTo(cursor_pos.x, cursor_pos.y - mark_handle_half_size);
        ctx.lineTo(cursor_pos.x, cursor_pos.y-2);
        ctx.moveTo(cursor_pos.x, cursor_pos.y + 2);
        ctx.lineTo(cursor_pos.x, cursor_pos.y +  + mark_handle_half_size);
        ctx.stroke(); 
    }
}

function handleFiles(files) {
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f.type.match("image.*")) {
            continue;
        }
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                background_image.src = e.target.result;
                document.title = "Editing " + theFile.name;
                invalidate();
                edit_file_name = theFile.name;
                var savedMark = window.localStorage.getItem(edit_file_name);
                if (savedMark) {
                    var saved_lines = JSON.parse(savedMark);
                    mark_lines = [];
                    for (var i = 0; i < saved_lines.length; i++) {
                        var line = saved_lines[i];
                        if (line.color) {
                            mark_lines[i] = new ColorMark(new Point(line.position.x, line.position.y), line.color, new Point(line.lable.x, line.lable.y));
                        } else {
                            mark_lines[i] = new LineMark(new Point(line.start.x, line.start.y), new Point(line.end.x, line.end.y));
                            mark_lines[i]._cache_length = line._cache_length;
                        }
                    };
                    invalidate();
                }
            }
        })(f);
        reader.readAsDataURL(f);
        break;
    };
}

function handleSelectFile(event) {
    handleFiles(event.target.files);
}

function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    var files = event.dataTransfer.files;
    handleFiles(files);
}

function save() {
    if (mark_lines.length > 0) {
        window.localStorage.setItem(edit_file_name, JSON.stringify(mark_lines));
    };
}

function mouse_handler_proxy() {
    this.onmousedown = function(event) {
        return mouse_handers[mark_mode].onmousedown(event);
    }
    this.onmouseup = function(event) {
        return mouse_handers[mark_mode].onmouseup(event);
    }
    this.onmousemove = function(event) {
        return mouse_handers[mark_mode].onmousemove(event);
    }
}
mouse_handers[MARK_MODE.LINE] = new LineModeHandler();
mouse_handers[MARK_MODE.COLOR] = new ColorModeHandler();
var mouse_proxy = new mouse_handler_proxy();
var select_file = document.getElementById('select-file');
select_file.addEventListener("change", handleSelectFile, false);
root.addEventListener("drop", handleDrop, false);
root.addEventListener("dragover", handleDragOver, false);
root.addEventListener("mousedown", mouse_proxy.onmousedown, false);
root.addEventListener("mousemove", mouse_proxy.onmousemove, false);
root.addEventListener("mouseup", mouse_proxy.onmouseup, false);
setInterval(render, 33);
document.addEventListener("keydown", function(event) {
    if (event.keyCode == 49) {
        mark_mode = MARK_MODE.LINE;
        mode_name.textContent = "Line";
        invalidate();
    } else if (event.keyCode == 50) {
        mark_mode = MARK_MODE.COLOR;
        mode_name.textContent = "Color";
        invalidate();
    }
})