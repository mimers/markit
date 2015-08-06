
function ColorModeHandler() {
    this.onmousedown = function(event) { 
        if (event.which != 1) {
            return;
        }
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        var ctx = image_layer.getContext("2d");
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
