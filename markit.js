var root = document.getElementById('root');
var mark_lines = [];
var current_line = null;
var need_paint = true;
var new_line_count = 0;
var background_image = new Image();
var font_size = 20;
var font_style = "18px mono";
var mark_handle_half_size = 6;
var cursor_pos = new Point(0, 0);
var edit_file_name;

function invalidate() {
    need_paint = true;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
    this.distanceTo = function(p) {
        return Math.sqrt((p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y));
    }
    this.radius = 5;
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
        if (this == current_line) {
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
        this.start.draw(ctx, this.isVertical(), this == current_line);
        this.end.draw(ctx, this.isVertical(), this == current_line);
        var text = "" + Math.floor(this.length());
        var center_x = (this.start.x + this.end.x) / 2;
        var center_y = (this.start.y + this.end.y) / 2;
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeText(text, center_x, center_y);
        ctx.restore();
        ctx.fillText(text, center_x, center_y);

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
    ctx.fillRect(0, 0, root.width, root.height);
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
    if (current_line != null) {
        current_line.draw(ctx);
    } else {
        // draw cursor
        ctx.beginPath();
        ctx.moveTo(cursor_pos.x - mark_handle_half_size, cursor_pos.y);
        ctx.lineTo(cursor_pos.x + mark_handle_half_size, cursor_pos.y);
        ctx.moveTo(cursor_pos.x, cursor_pos.y - mark_handle_half_size);
        ctx.lineTo(cursor_pos.x, cursor_pos.y + mark_handle_half_size);
        ctx.stroke();
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

root.onmousedown = function(event) {
    if (event.which != 1) {
        return;
    }
    current_line = new LineMark(new Point(Math.floor(event.layerX), Math.floor(event.layerY)),
        new Point(Math.floor(event.layerX), Math.floor(event.layerY)));
    new_line_count = 0;
    invalidate();
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

root.onmouseup = function(event) {
    if (event.which != 1) {
        return;
    }
    if (current_line != null && new_line_count == 1) {
        var pix_x = Math.floor(event.layerX);
        var pix_y = Math.floor(event.layerY);
        current_line.end.x = Math.floor(pix_x);
        current_line.end.y = Math.floor(pix_y);
        adjustLineDirection(current_line);
        if (current_line.length() > 0) {
            mark_lines[mark_lines.length] = current_line;
        }
    }
    current_line = null;
    cursor_pos.x = pix_x;
    cursor_pos.y = pix_y;
    invalidate();
}

root.onmousemove = function(event) {
    if (event.which != 1 && current_line != null) {
        return;
    }
    var pix_x = Math.floor(event.layerX);
    var pix_y = Math.floor(event.layerY);
    if (current_line != null) {
        current_line.end.x = pix_x;
        current_line.end.y = pix_y;
        adjustLineDirection(current_line);
        new_line_count = 1;
    } else if (cursor_pos.x != pix_x || cursor_pos.y != pix_y) {
        cursor_pos.x = pix_x;
        cursor_pos.y = pix_y;
    }
    invalidate();
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
        var blob = new Blob([JSON.stringify(mark_lines)], {
            type: "application/json;charset=utf-8"
        });
        saveAs(edit_file_name + ".json");
    };
}

function SaveDatFileBro(localstorage) {
    localstorage.root.getFile("info.txt", {
        create: true
    }, function(DatFile) {
        DatFile.createWriter(function(DatContent) {
            var blob = new Blob(["Lorem Ipsum"], {
                type: "text/plain"
            });
            DatContent.write(blob);
        });
    });
}

var select_file = document.getElementById('select-file');
select_file.addEventListener("change", handleSelectFile, false);
root.addEventListener("drop", handleDrop, false);
root.addEventListener("dragover", handleDragOver, false);
navigator.webkitPersistentStorage.requestQuota(1024 * 1024, function() {
    window.webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024, SaveDatFileBro);
})
setInterval(render, 15);