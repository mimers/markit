
function MoveHandler () {
    this.onmousedown = function(event) {
        draging = true;
        donw_pos.update(event.clientX, event.y);
        origin_pos.copy(image_pos);
        event.preventDefault();
    }

    this.onmouseup = function(event) {
        draging = false;
        event.preventDefault();
    }

    this.onmousemove = function(event) {
        if (draging) {
            image_pos.update(origin_pos.x + event.x - donw_pos.x,
                origin_pos.y + event.y - donw_pos.y);
            event.preventDefault();
        }
    }
}
