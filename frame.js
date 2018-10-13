//Version $Id: frame.js,v 1.16 2012/12/12 17:14:07 len Exp $

var frames;
var cnt = 0;
var drawParams;
var frameData;
var frameName;

function checkCanvas(){
    //http://stackoverflow.com/questions/2745432/best-way-to-detect-that-html5-canvas-is-not-supported
    var canvas2DSupported = !!window.CanvasRenderingContext2D;
    if(!canvas2DSupported){
	/*
	var docHeight = $(document).height();
	$("body").append("<div id='overlay'>HTML5 Canvas, as required by this application<br/>is not supported in this browser!<br/>Try <a href='http://en.wikipedia.org/wiki/Canvas_element#Support'>another</a>!</div>");

	$("#overlay")
	    .height(docHeight)
	    .css({
		'font-size' : '180%',
		'font-weight' : 'bold',
		'padding-top' : 200,
		'vertical-align' : 'middle',
		'text-align' : 'center',
		'color' : 'red',
		'opacity' : 0.8,
		'position': 'absolute',
		'top': 0,
		'left': 0,
		'background-color': 'black',
		'width': '100%',
		'z-index': 5000
	    });
	*/
	window.location.href = "unsupported.html";
	return;
    }
}

$(document).ready(function(){
    //var width = $(window).width();
    //$('#frameCanvas').width(width);
    //$('#frameCanvas').height(width/2);

    //check for canvas support
    checkCanvas();

    var ref = getUrlVars()['ref'];
    if ( ref == undefined ){
	ref = 'frames';
    }

    $.ajax({
        type:'GET',
        url: ref + '.json',                    
        dataType:'json',
        cache:false,
        success:function(aData){
	    frames = aData;
	    
            $('#frames').get(0).options.length = 0;
            $('#frames').get(0).options[0] = new Option("--Select--", "0");

            $.each(aData, function(i,item) {
		$('#frames').get(0).options[$('#frames').get(0).options.length] = new Option(item.name, item.id);
            });

	    drawParams = initDrawParams('frameCanvas');
	    clear(true, true);

	    $('#frames').change(function(){
		loadFrameData();
	    });

	    $('#draw').click(function(){
		draw();
		window.scrollTo(0, 0); //go to top to ensure visibility
	    });
	    
	    $('#clear').click(function(){
		clear(true, true);
	    });

	    $('#randomColor').click(function(){
		randomColor();
	    });
        },
        error:function(){alert("Connection is not available!");}
    });
});

function cos(angle){
    return Math.cos(angle * Math.PI / 180);
}

function sin(angle){
    return Math.sin(angle * Math.PI / 180);
}

function asin(val){
    return Math.asin(val) * 180 / Math.PI;
}

function ctg(angle){
    return 1/Math.tan(angle * Math.PI / 180);
}

function initDrawParams(canvasName){
    var canvas = document.getElementById(canvasName);
    var params = {};
    params['canvasName'] = canvasName;
    //start drawing point
    params['x0'] = canvas.width * .45;
    params['y0'] = canvas.height * .9;
    params['scale'] = canvas.height / 1250; //draw max 1250mm
    //D!console.log('x0: ' + params.x0 + ', y0:' + params.y0 + ', scale: ' + params.scale);
    return params;
}

function checkData(){
    frameData = {}
    var check = ['BB', 'CS', 'ST', 'STCC', 'WB', 'HT'];
    for(var i = 0; i < check.length; i++){
	var item = check[i];
	var x = parseInt($('#' + item).val());
	if(isNaN(x)){
	    alert('Missing or invalid: ' + item + '!');
	    return false;
	}
	frameData[item] = x;
    }
    check = ['STA', 'HTA'];
    for(var i = 0; i < check.length; i++){
	var item = check[i];
	var x = parseFloat($('#' + item).val());
	if(isNaN(x)){
	    alert('Missing or invalid: ' + item + '!');
	    return false;
	}
	frameData[item] = x;
    }
    
    var RE = parseInt($('#RE').val());
    var SK = parseInt($('#SK').val());
    var TT = parseInt($('#TT').val());
    var TTT = parseInt($('#TTT').val());

    if((isNaN(RE) || isNaN(SK)) && (isNaN(TT) || isNaN(TTT))){
	alert('RE & SK or TT && TTT are required!');
	return false;
    }

    //calculate RE and SK
    if(isNaN(RE) || isNaN(SK)){
	frameData['TT'] = TT;
	frameData['TTT'] = TTT;
	var h1 = frameData['STCC'] * sin(frameData['STA']);

	var beta = asin(frameData['TT'] * sin(frameData['STA']) / frameData['TTT']);
	//D!console.log('beta: ' + beta);

	var h2 = frameData['TTT'] * sin(frameData['STA'] + beta);
	frameData['SK'] = h1 + h2;	
	//D!console.log('SK: ' + frameData['SK']);
	frameData['RE'] = frameData['TT'] - frameData['SK'] * ctg(frameData['STA']);
	
	$('#RE').val(frameData['RE']);
	$('#SK').val(frameData['SK']);
/*
	var BT1 = frameData['BB'] * ctg(frameData['STA']);
	var BT2 = frameData['WB'] - Math.sqrt(frameData['CS'] * frameData['CS'] - frameData['BB'] * frameData['BB']); 
	console.log(BT1 + ', ' + BT2 + ', ' + (BT1 + BT2) + ', ' + frameData['TT']);
	frameData['SK'] = (BT1 + BT2 - frameData['TT'] - 40) * sin(frameData['HTA']) * sin(frameData['STA']) / sin(frameData['STA'] - frameData['HTA']);
	console.log('SK: ' + frameData['SK']);
	frameData['RE'] = BT2 - frameData['SK'] * ctg(frameData['HTA']);
	console.log('RE: ' + frameData['RE']);
*/
    }else{
	frameData['SK'] = SK;
	frameData['RE'] = RE;
	frameData['TT'] = frameData['SK'] * ctg(frameData['STA']) + frameData['RE'];
	//D!console.log('TT calculated: ' + frameData['TT']);
	$('#TT').val(frameData['TT']);

	AB = frameData['SK'] / sin(frameData['STA']) - frameData['STCC'];
	AC = frameData['TT'] - frameData['RE'] - frameData['STCC'] * cos(frameData['STA']);
	frameData['TTT'] = Math.sqrt ( AB * AB + frameData['TT'] * frameData['TT'] - 2 * frameData['TT'] * AC);
	//D!console.log('TTT calculated: ' + frameData['TTT']); 
	$('#TTT').val(frameData['TTT']);

	var beta = asin(frameData['TT'] * sin(frameData['STA']) / frameData['TTT']);
    }

    frameData['WS'] = $('#WS').val();
    //based on Radon data
    if(frameData['WS'] == '29'){
	frameData['WSM'] = 373;
    }else{
	frameData['WSM'] = 342;
    }

    //calculate SH
    var SH = parseInt($('#SH').val());
    if (isNaN(SH)){
	frameData['SH'] = frameData['WSM'] - frameData['BB'] + sin(frameData['STA']) * frameData['STCC'] + sin(beta + frameData['STA']) * frameData['TTT'] / 2;
	//D!console.log('SH: ' + frameData['SH']);
	$('#SH').val(frameData['SH']);
	//D!console.log('WSM' + frameData['WSM'] + ', ' + frameData['WS']);
    }

    var FUL = parseInt($('#FUL').val());
    if (FUL == 1){
	frameData['FUL'] = 1;
    }
    return true;
}

function draw(){
    if(!checkData())return;

    if(cnt == 0){
	clear(false, false);
    }

    drawInseam();

    var color = $('#color').val();
    color = "#" + color; //for FF
    drawFrame(frameData, color);
}

function drawInseam(){
    var inseam = parseInt($('#inseam').val(), 10);
    if(inseam == NaN)return;

    //inseam = inseam * 10;
    var canvas = document.getElementById(drawParams.canvasName);
    var context = canvas.getContext('2d');    

    context.save();

    context.translate(drawParams.x0, drawParams.y0)
    context.scale(drawParams.scale, drawParams.scale);

    context.lineWidth = 1;

    context.beginPath();

    context.moveTo(-450, -inseam);
    context.lineTo(700, -inseam);
    context.closePath();
    context.stroke();

    context.restore();
}

function drawFrame(fp, color){  
    var canvas = document.getElementById(drawParams.canvasName);
    var context = canvas.getContext('2d');    

    //p1
    xp1 = 0;
    yp1 = - fp['WSM'] + fp['BB'];

    //p2
    xp2 = xp1 - Math.sqrt(fp['CS'] * fp['CS'] - fp['BB'] * fp['BB']);
    yp2 = - fp['WSM'];

    //p3
    xp3 = xp1 - (fp['STCC'] * cos(fp['STA']));
    yp3 = yp1 - (fp['STCC'] * sin(fp['STA']));
	
    //p4
    xp4 = xp1 - (fp['ST'] * cos(fp['STA']));
    yp4 = yp1 - (fp['ST'] * sin(fp['STA']));

    //p5
    xp5 = xp2 + fp['WB'];
    yp5 = yp2;    

    //p6
    xp6 = xp1 + fp['RE'];
    yp6 = yp1 - fp['BB'] - fp['SK'];

    //p7
    xp7 = xp6 + fp['HT'] * cos(fp['HTA']);
    yp7 = yp6 + fp['HT'] * sin(fp['HTA']);

    context.fillStyle = color;
    context.font = "bold 12px sans-serif";
    context.fillText(frameName, 10, 15 + cnt * 20);
    cnt ++;

    context.save();

    context.translate(drawParams.x0, drawParams.y0)
    context.scale(drawParams.scale, drawParams.scale);

    context.strokeStyle = color;
    context.lineWidth = 2 / drawParams.scale;

    context.beginPath();

    //CS
    context.moveTo(xp1, yp1);
    context.lineTo(xp2, yp2);

    //ST
    context.moveTo(xp1, yp1);
    context.lineTo(xp4, yp4);

    //TT
    context.moveTo(xp3, yp3);
    context.lineTo(xp6, yp6);

    //HT
    context.lineTo(xp7, yp7);

    //BT
    context.lineTo(xp1, yp1);

    context.closePath();
    context.stroke();

    //close back
    if(fp.hasOwnProperty('FUL')){
	drawFullySpring(context, xp2, yp2, xp3, yp3);
    }else{
	context.moveTo(xp2, yp2);
	context.lineTo(xp3, yp3);
	context.stroke();
    }
   
    //wheels
    context.beginPath();
    context.arc(xp2, yp2, fp['WSM'], 0, 2 * Math.PI, false);
    context.closePath();
    context.stroke();

    context.beginPath();
    context.arc(xp5, yp5, fp['WSM'], 0, 2 * Math.PI, false);
    context.closePath();
    context.stroke();

    context.restore();
}

function drawFullySpring(context, x1, y1, x2, y2){
    //configuration
    var r = 30; //spring radius
    var n = 7;  //no of segments
    var ratio1 = 3/6; //first straight part of total segment
    var ratio2 = 2/6; //spring

    //draw
    context.beginPath();
    var xnrd = (x2 - x1);
    var ynrd = (y2 - y1);
    var sina = Math.abs(ynrd / Math.sqrt ( xnrd * xnrd + ynrd * ynrd));
    var cosa = Math.abs(xnrd / Math.sqrt ( xnrd * xnrd + ynrd * ynrd));
 
    //first "straight" segment
    context.moveTo(x1, y1);

    x = x1 + xnrd*ratio1;
    y = y1 + ynrd*ratio1;

    context.lineTo(x, y);

    var xr, yr;
    //the spring
    for(var i = 1; i < n; i++){
	x = x + xnrd*ratio2/n;
	y = y + ynrd*ratio2/n;
	if ( i % 2 == 1){
	    xr = x + r * sina;
	    yr = y + r * cosa;
	}else{
	    xr = x - r * sina;
	    yr = y - r * cosa;
	}
	context.lineTo(xr, yr);
    }

    x = x + xnrd*ratio2/n;
    y = y + ynrd*ratio2/n;
    context.lineTo(x, y);

    //final "straight" segment
    context.lineTo(x2, y2);

    context.stroke();
}

function clear(eraseData, drawInfo){
    var canvas = document.getElementById(drawParams.canvasName);
    var context = canvas.getContext('2d');

    if(eraseData){
	cnt = 0;
	frameData = null;
	frameName = "Custom";
	$('#frames').val(0);
	loadFrameData();
	$('#inseam').val('');
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.width; //IE

    if(drawInfo){
	var img = new Image(); // Create new img element
	img.onload = function(){
	    context.drawImage(img, 0, 0);
	};
	img.src = 'doc/draw.png';
    }
}

function loadFrameData(){
    //clean inputs
    $('.frameDataInput').each(function(i){
	$(this).val('');
    });
    v = $('#frames').val();
    if(v != '0'){
	frameData = frames[v];
	$.each(frameData.params, function(i, item){
	    //D!console.log(i + ', ' + item);
	    $('#' + i).val(item);
	});
	frameName = frameData.name;
    }else{
	frameData = null;
	frameName = "Custom";
	$('#WS').val('26');
    }
}

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function randomColor(){
    var hsv = [ Math.random() * 6, Math.abs(Math.random() - 0.7), Math.random() ];
    //D!console.log('hsv: ' + hsv);
    document.getElementById('color').color.fromHSV(hsv[0], hsv[1], hsv[2]);
}