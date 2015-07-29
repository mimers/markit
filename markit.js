
var image_size = new Positon(0, 0);
var image_pos = new Positon(0, 0);
image_pos.setElement(container);
var pointer_pos = new Positon(0, 0);
var image_scale = 1;
var image_pading = 12;

var MARK_MODE = {
    'LINE': 0,
    'COLOR': 1,
    'RECT': 2,
    'MOVE': 3
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
var mode_elem = [];
var mouse_handers = [];

mode_elem[MARK_MODE.LINE] = document.getElementById("line_mode");
mode_elem[MARK_MODE.COLOR] = document.getElementById("color_mode");
mode_elem[MARK_MODE.RECT] = document.getElementById("rect_mode");
mode_elem[MARK_MODE.MOVE] = document.getElementById("move_mode");

image.onload = function () {
    image_size.x = image.width;
    image_size.y = image.height;
    container.style.width = image.width;
    container.style.height = image.height;
    root.style.width = image.width;
    root.style.height = image.height;
    root.width = image.width;
    root.height = image.height;
}
image.src = "grid.png";

var control = container;
control.onmousewheel = function(event) {
    if (event.wheelDelta > 0) {} else {}
    event.preventDefault();
}
var donw_pos = new Positon(0, 0);
var origin_pos = new Positon(0, 0);
var draging = false;
var scale_to_class = ['one_cursor', 'two_cursor', 'three_cursor'];

scale.onchange = function(event) {
    container.style.width = image_size.x * scale.value;
    container.style.height = image_size.y * scale.value;
    var factor = scale.value / image_scale;
    image_pos.update(Math.floor(image_pos.x * factor - (window.innerWidth / 2) * (factor - 1)),
        Math.floor(image_pos.y * factor - (window.innerHeight / 2) * (factor - 1)));
    image.style.left = image_pos.x;
    image.style.top = image_pos.y;
    container.classList.remove(scale_to_class[parseInt(image_scale)-1]);
    container.classList.add(scale_to_class[parseInt(scale.value)-1]);
    image_scale = scale.value;
}

function init() {
    scale.value = 1;
    container.classList.add('one_cursor');
}

init();

function invalidate() {
    need_paint = true;
    requestAnimationFrame(render);
}

function paint_text(text, x, y, ctx) {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.restore();
    ctx.fillText(text, x, y);
}


function render() {
    if (!need_paint) {
        return;
    }
    console.log("render!");
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
        ctx.font = '60px serif';
        ctx.fillText("Drop image here!", root.width / 2, root.height / 2);
        ctx.font = tf;
    };
    ctx.restore();
    need_paint = false;
    requestAnimationFrame(render);
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

function swith_mode (mode) {
    mark_mode = mode;
    for (m in mode_elem) {
        if (m == mode) {
            mode_elem[m].className = "current";
        } else {
            mode_elem[m].className = '';
        }
    }
}

mouse_handers[MARK_MODE.LINE] = new LineModeHandler();
mouse_handers[MARK_MODE.COLOR] = new ColorModeHandler();
mouse_handers[MARK_MODE.MOVE] = new MoveHandler();
var mouse_proxy = new mouse_handler_proxy();
var select_file = document.getElementById('select-file');
select_file.addEventListener("change", handleSelectFile, false);
root.addEventListener("drop", handleDrop, false);
root.addEventListener("dragover", handleDragOver, false);
root.addEventListener("mousedown", mouse_proxy.onmousedown, false);
root.addEventListener("mousemove", mouse_proxy.onmousemove, false);
root.addEventListener("mouseup", mouse_proxy.onmouseup, false);
requestAnimationFrame(render);
var last_mode = null;
swith_mode(MARK_MODE.LINE);
document.addEventListener("keydown", function(event) {
    if (event.keyCode == 0x31) {
        swith_mode(MARK_MODE.LINE);
    } else if (event.keyCode == 0x32) {
        swith_mode(MARK_MODE.COLOR);
    } else if (event.keyCode == 0x33) {
        // swith_mode(MARK_MODE.RECT);
    } else if (event.keyCode == 0x20) {
        if (mark_mode == MARK_MODE.MOVE) {return;};
        last_mode = mark_mode;
        swith_mode(MARK_MODE.MOVE);
    }
    invalidate();
})

document.addEventListener("keyup", function (event) {
    if (event.keyCode == 0x20) {
        swith_mode(last_mode);
        last_mode = null;
    };
    invalidate();
})