
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
