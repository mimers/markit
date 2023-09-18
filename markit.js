
var image_size = new Positon(0, 0);
var image_pos = new Positon(0, 0);
var pointer_pos = new Positon(0, 0);
var image_scale = 1;
var image_pading = 12;

var MARK_MODE = {
    'LINE': 0,
    'COLOR': 1,
    'RECT': 2,
    'MOVE': 3
}
var mark_layer = document.getElementById('mark_layer');
var image_layer = document.getElementById('image_layer');
var mode_name = document.getElementById('mode-name');
var mark_lines = [];
var current_mark = null;
var need_paint = true;
var new_line_count = 0;
var background_image = new Image();
var font_size = 20;
var font_style = "18px 'Open Sans','Helvetica Neue',Arial,'Hiragino Sans GB','Microsoft YaHei','WenQuanYi Micro Hei'";
var mark_handle_half_size = 6;
var cursor_pos = new Point(0, 0);
var edit_file_name;
var mark_mode = MARK_MODE.LINE;
var mode_elem = [];
var mouse_handlers = [];
var last_mode = null;

EventFilter = function () {
}
EventFilter.prototype.filter = function (event) {
    this.x = event.x;
    this.y = event.y;
    this.layerX = (event.layerX - image_pos.x) / image_scale;
    this.layerY = (event.layerY - image_pos.y) / image_scale;
    this.which = event.which;
}

var filterd_event = new EventFilter();
var mouse_proxy = new mouse_handler_proxy();


var control = container;
var donw_pos = new Positon(0, 0);
var origin_pos = new Positon(0, 0);
var draging = false;
var scale_to_class = ['one_cursor', 'two_cursor', 'three_cursor'];

scale.onchange = function(event) {
    image_pos.setElement(container);
    container.style.width = image_size.x * scale.value;
    container.style.height = image_size.y * scale.value;
    mark_layer.width = image_size.x * scale.value;
    mark_layer.height = image_size.y * scale.value;
    var factor = scale.value / image_scale;
    image_pos.update(Math.floor(image_pos.x * factor - (window.innerWidth / 2) * (factor - 1)),
        Math.floor(image_pos.y * factor - (window.innerHeight / 2) * (factor - 1)));
    container.classList.remove(scale_to_class[parseInt(image_scale)-1]);
    container.classList.add(scale_to_class[parseInt(scale.value)-1]);
    image_scale = scale.value;
    invalidate();
}

function init() {
    mode_elem[MARK_MODE.LINE] = document.getElementById("line_mode");
    mode_elem[MARK_MODE.COLOR] = document.getElementById("color_mode");
    mode_elem[MARK_MODE.RECT] = document.getElementById("rect_mode");
    mode_elem[MARK_MODE.MOVE] = document.getElementById("move_mode");
    scale.value = 1;
    container.classList.add('one_cursor');
    mouse_handlers[MARK_MODE.LINE] = new LineModeHandler();
    mouse_handlers[MARK_MODE.COLOR] = new ColorModeHandler();
    mouse_handlers[MARK_MODE.MOVE] = new MoveHandler();
    mark_layer.addEventListener("mousedown", mouse_proxy.onmousedown, false);
    mark_layer.addEventListener("mousemove", mouse_proxy.onmousemove, false);
    mark_layer.addEventListener("mouseup", mouse_proxy.onmouseup, false);
    swith_mode(MARK_MODE.LINE);
    control.onmousewheel = function(event) {
        event.preventDefault();
    }
}

function invalidate(image) {
    need_paint = true;
    requestAnimationFrame(render);
    if (image) {
        image_size.x = image.width;
        image_size.y = image.height;
        container.style.width = image.width;
        container.style.height = image.height;
        mark_layer.width = image.width;
        mark_layer.height = image.height;
        image_layer.width = image.width;
        image_layer.height = image.height;
        update_image(image);
    };
}

function update_image (image) {
    var ctx = image_layer.getContext('2d');
    ctx.drawImage(image, 0, 0);
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
    var ctx = mark_layer.getContext('2d');
    ctx.save();
    ctx.scale(image_scale, image_scale);
    ctx.translate(0.5, 0.5);
    ctx.fillStyle = "white";
    ctx.font = font_style;
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, mark_layer.width, mark_layer.height);
    ctx.strokeStyle = "red";
    ctx.fillStyle = "red";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (var i in mark_lines) {
        mark_lines[i].draw(ctx);
    }
    if (current_mark != null) {
        current_mark.draw(ctx);
    }
    if (!background_image.src) {
        var tf = ctx.font;
        ctx.font = "60px 'Open Sans','Helvetica Neue',Arial,'Hiragino Sans GB','Microsoft YaHei','WenQuanYi Micro Hei'"
        ctx.fillText("Drop image here!", mark_layer.width / 2, mark_layer.height / 2);
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
        filterd_event.filter(event);
        console.log('proyx', mark_mode)
        return mouse_handlers[mark_mode].onmousedown(filterd_event);
    }
    this.onmouseup = function(event) {
        filterd_event.filter(event);
        return mouse_handlers[mark_mode].onmouseup(filterd_event);
    }
    this.onmousemove = function(event) {
        filterd_event.filter(event);
        return mouse_handlers[mark_mode].onmousemove(filterd_event);
    }
}

function swith_mode (mode) {
    mark_mode = mode;
    console.log('mode', mode)
    for (m in mode_elem) {
        if (m == mode) {
            mode_elem[m].classList.add("current");
        } else {
            mode_elem[m].classList.remove("current");
        }
    }
}

requestAnimationFrame(render);
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
        image_pos.setElement(container);
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


init();