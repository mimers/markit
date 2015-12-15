
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
                invalidate(background_image);
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

var select_file = document.getElementById('select-file');
select_file.addEventListener("change", handleSelectFile, false);
mark_layer.addEventListener("drop", handleDrop, false);
mark_layer.addEventListener("dragover", handleDragOver, false);


