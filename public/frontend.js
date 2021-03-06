var socket = io();

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

ctx.translate(window.innerWidth/2, window.innerHeight/2);
ctx.scale((window.innerHeight+window.innerWidth)/1600, (window.innerHeight+window.innerWidth)/1600);
ctx.translate(-window.innerWidth/2, -window.innerHeight/2);


var my_socket_id;

var grass = new Image();
grass.src = '/images/grass.png';
var tree = new Image();
tree.src = '/images/tree.png';
var rock = new Image();
rock.src = '/images/rock.png';
var stat_bar = new Image();
stat_bar.src = '/images/stat_bar.png';
var player_image = new Image();
player_image.src = '/images/player.png';
var dagger_icon = new Image();
dagger_icon.src = '/images/dagger.png';
var sword_icon = new Image();
sword_icon.src = '/images/sword.png';
var bow_icon = new Image();
bow_icon.src = '/images/bow.png';
var first_aid_icon = new Image();
first_aid_icon.src = '/images/firstaid.png';
var arrow_icon = new Image();
arrow_icon.src = '/images/arrow.png';
var item_holder_icon = new Image();
item_holder_icon.src = '/images/itemholder.png';
var bottle_empty = new Image();
bottle_empty.src = '/images/canteen_empty.png';
var bottle_full = new Image();
bottle_full.src = '/images/canteen_full.png';
var meat = new Image();
meat.src = '/images/meat.png';
var land_mine = new Image();
land_mine.src = '/images/land_mine.png';
var wolf = new Image();
wolf.src = '/images/wolf.png';
var pig = new Image();
pig.src = '/images/pig.png';

//handle stat choosing
var brawn_points = 0;
var intelligence_points = 0;
var agility_points = 0;
var points_to_spend = 6;
var username = "";

function updateLobbyClient(type, direction){
	if(direction == "ADD"){
		if(points_to_spend > 0){
			if(type == "brawn" && brawn_points < 4){
				brawn_points++;
				points_to_spend--;
			}
			if(type == "intelligence" && intelligence_points < 4){
				intelligence_points++;
				points_to_spend--;
			}
			if(type == "agility" && agility_points < 4){
				agility_points++;
				points_to_spend--;
			}
		}
	}else{
		if(type == "brawn" && brawn_points > 0){
			brawn_points--;
			points_to_spend++;
		}
		if(type == "intelligence" && intelligence_points > 0){
			intelligence_points--;
			points_to_spend++;
		}
		if(type == "agility" && agility_points > 0){
			agility_points--;
			points_to_spend++;
		}

	}
	document.getElementById("pointsLeft").innerHTML = "Skill points left: " + points_to_spend + " points";
	document.getElementById("brawn_amount").style.width = ((brawn_points)*75) + "px";
	document.getElementById("intelligence_amount").style.width = ((intelligence_points)*75) + "px";
	document.getElementById("agility_amount").style.width = ((agility_points)*75) + "px";
	username = document.getElementById("usernameTextbox").value;
}

function submitStatData(){
	var data = [brawn_points, intelligence_points, agility_points, username];
	socket.emit('register_form', data);
	document.getElementById("submitButton").style.display = "none";
	submitted = true;
	alert("You have joined the game successfully!");
}


//send client keyboard and mouse state to server
var mouse_X = 0;
var mouse_Y = 0;
var is_clicking = false;
var rightkeydown = false;
var leftkeydown = false;
var upkeydown = false;
var downkeydown = false;
var shiftkeydown = false;
var spacekeydown = false;
var ekeydown = false;
var enterkeydown = false;

var onekeydown = false;
var twokeydown = false;
var threekeydown = false;
var fourkeydown = false;
var fivekeydown = false;
var submitted = false;

var isActivePlayer = false;
var check_spectate_trigger;

function sendData(){
	var data = [mouse_X, mouse_Y, is_clicking, rightkeydown, leftkeydown, upkeydown, downkeydown, shiftkeydown, spacekeydown, ekeydown, enterkeydown, onekeydown, twokeydown, threekeydown, fourkeydown, fivekeydown];
	socket.emit('user_input_state', data);

}

window.onmousemove = function(e){
	mouse_X = e.clientX;
	mouse_Y = e.clientY;
	sendData();

}
window.onmousedown = function(){
	is_clicking = true;
	sendData();
}
window.onmouseup = function(){
	is_clicking = false;
	sendData();
}
window.onkeydown = function(e){
	var key=e.keyCode ? e.keyCode : e.which;
	if (key===65) leftkeydown = true;
	if (key===68) rightkeydown = true;
	if (key===87) upkeydown = true;
	if (key===83) downkeydown = true;
	if (key===16) shiftkeydown = true;
	if (key===32) spacekeydown = true;
	if (key===69) ekeydown = true;
	if (key===13) enterkeydown = true;
	if (key===49) onekeydown = true;
	if (key===50) twokeydown = true;
	if (key===51) threekeydown = true;
	if (key===52) fourkeydown = true;
	if (key===53) fivekeydown = true;
	sendData();


}
window.onkeyup = function(e){
	var key=e.keyCode ? e.keyCode : e.which;
	if (key===65) leftkeydown = false;
	if (key===68) rightkeydown = false;
	if (key===87) upkeydown = false;
	if (key===83) downkeydown = false;
	if (key===16) shiftkeydown = false;
	if (key===32) spacekeydown = false;
	if (key===69) ekeydown = false;
	if (key===13) enterkeydown = false;
	if (key===49) onekeydown = false;
	if (key===50) twokeydown = false;
	if (key===51) threekeydown = false;
	if (key===52) fourkeydown = false;
	if (key===53) fivekeydown = false;
	sendData();
}

window.onresize = function(e){
	document.getElementById("myCanvas").width=window.innerWidth;
	document.getElementById("myCanvas").height=window.innerHeight;
	ctx.translate(window.innerWidth/2, window.innerHeight/2);
	ctx.scale((window.innerHeight+window.innerWidth)/1600, (window.innerHeight+window.innerWidth)/1600);
	ctx.translate(-window.innerWidth/2, -window.innerHeight/2);
}


//other code
var cameraX = 0;
var cameraY = 0;

function clear(){
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, c.width, c.height);
}

socket.on('your_socket_id', function(socket_id){
	my_socket_id = socket_id;
});

socket.on('basic_data', function(data){
	if(data.stage == "STATS"){
		document.getElementById("gameDiv").style.display = "none";
		document.getElementById("statsDiv").style.display = "block";
		document.getElementById("spectatorDiv").style.display = "none";
		document.getElementById("countdownDiv").innerHTML = data.countdown;
		if(!submitted){
			document.getElementById("submitButton").style.display = "block";
		}
	}
	if(data.stage == "GAMEPLAY"){
		submitted = false;
		document.getElementById("statsDiv").style.display = "none";
		if(isActivePlayer){
			document.getElementById("spectatorDiv").style.display = "none";
			document.getElementById("gameDiv").style.display = "block";
		}else{
			document.getElementById("spectatorDiv").style.display = "block";
			var timeLeft = Math.round(Math.sqrt((data.map_radius-50)/20)*25) - 100;
			if(timeLeft > 0){
				document.getElementById("spectatorCountdownDiv").innerHTML = "Next game starting in <u>at most</u> <b>" + timeLeft + "</b> seconds.";
			}else{
				document.getElementById("spectatorCountdownDiv").innerHTML = "Game starting VERY soon...";
			}

			document.getElementById("gameDiv").style.display = "none";

		}

	}
});

function drawRotatedImage (ctx, image, angleRad , xPos, yPos, xAx, yAx) {
		  ctx.translate(xPos, yPos);
		  ctx.rotate(angleRad);
		  ctx.drawImage(image, -xAx, -yAx);
		  ctx.rotate(-angleRad );
		  ctx.translate(-xPos, -yPos);
		};

socket.on('all_game_data', function(data){
	if(data.stage == "GAMEPLAY"){
		isActivePlayer = true;
		clearInterval(check_spectate_trigger);
		check_spectate_trigger = setTimeout(function(){isActivePlayer = false;}, 2000); //changes to specator mode if no frames recieved for 2 seconds

		var window_dime = [window.innerWidth, window.innerHeight];
		socket.emit('window_size_data', window_dime);

		clear();

		for(var i = 0; i < data.players.length; i++){
			if(typeof data.players[i] !== 'undefined'){
				if(data.players[i].socket_id == my_socket_id){
					cameraX = data.players[i].xPos-window.innerWidth/2;
					cameraY = data.players[i].yPos-window.innerHeight/2;

				}
			}
		}

		for(var i = -2; i < (window.innerWidth/40)+1; i++){
			for(var j = -2; j < (window.innerHeight/40)+1; j++){
				var drawX = i*40 - (cameraX % 40);
				var drawY = j*40 - (cameraY % 40);
				var mapDrawCenterX = data.map_center_x - cameraX;
				var mapDrawCenterY = data.map_center_y - cameraY;
				var deltaX = drawX - mapDrawCenterX;
				var deltaY = drawY - mapDrawCenterY;


				if(Math.sqrt((deltaX*deltaX) + (deltaY*deltaY)) < data.map_radius + 12){
					ctx.drawImage(grass, drawX, drawY);
				}

			}
		}

		ctx.fillStyle = "#000000";
		ctx.globalAlpha = 0.3;

		for(var i = 0; i < data.shadows.length; i++){

			ctx.beginPath();

			var ray_one_deltaX = data.shadows[i].cast_vertex_a.xPos - data.shadows[i].origin_vertex.xPos;
			var ray_one_deltaY = data.shadows[i].cast_vertex_a.yPos - data.shadows[i].origin_vertex.yPos;

			var ray_one_distance = Math.sqrt(ray_one_deltaX*ray_one_deltaX + ray_one_deltaY*ray_one_deltaY);
			var ray_one_unitX = ray_one_deltaX/ray_one_distance;
			var ray_one_unitY = ray_one_deltaY/ray_one_distance;

			var ray_two_deltaX = data.shadows[i].cast_vertex_b.xPos - data.shadows[i].origin_vertex.xPos;
			var ray_two_deltaY = data.shadows[i].cast_vertex_b.yPos - data.shadows[i].origin_vertex.yPos;

			var ray_two_distance = Math.sqrt(ray_two_deltaX*ray_two_deltaX + ray_two_deltaY*ray_two_deltaY);
			var ray_two_unitX = ray_two_deltaX/ray_two_distance;
			var ray_two_unitY = ray_two_deltaY/ray_two_distance;

			ctx.moveTo(data.shadows[i].cast_vertex_a.xPos - cameraX, data.shadows[i].cast_vertex_a.yPos - cameraY);
			ctx.lineTo(data.shadows[i].cast_vertex_a.xPos + ray_one_unitX * data.draw_length*3 - cameraX, data.shadows[i].cast_vertex_a.yPos + ray_one_unitY * data.draw_length*3 - cameraY);
			ctx.lineTo(data.shadows[i].cast_vertex_b.xPos + ray_two_unitX * data.draw_length*3 - cameraX, data.shadows[i].cast_vertex_b.yPos + ray_two_unitY * data.draw_length*3 - cameraY);
			ctx.lineTo(data.shadows[i].cast_vertex_b.xPos - cameraX, data.shadows[i].cast_vertex_b.yPos - cameraY);
			ctx.closePath();
			ctx.fill();
		}

		ctx.globalAlpha = 1;

		for(var i = 0; i < data.obstacles.length; i++){
			if(data.obstacles[i].type == "TREE"){
				ctx.drawImage(tree, data.obstacles[i].xPos - cameraX - 20,data.obstacles[i].yPos- cameraY - 20);
			}else{
				ctx.drawImage(rock, data.obstacles[i].xPos - cameraX,data.obstacles[i].yPos- cameraY);
			}
		}



		/*for(var i = 0; i < data.shadows.length; i++){
			ctx.fillStyle = "#000000";
			ctx.beginPath();

			ctx.moveTo(data.shadows[i].cast_vertex_a.xPos - cameraX, data.shadows[i].cast_vertex_a.yPos - cameraY);
			ctx.lineTo(data.shadows[i].cast_vertex_b.xPos - cameraX, data.shadows[i].cast_vertex_b.yPos - cameraY);

			ctx.stroke();
		}*/

		for(var i = 0; i < data.items.length; i++){
			if(data.items[i].type == "dagger"){
				ctx.drawImage(dagger_icon, data.items[i].xPos - cameraX,data.items[i].yPos- cameraY);
			}
			if(data.items[i].type == "sword"){
				ctx.drawImage(sword_icon, data.items[i].xPos - cameraX,data.items[i].yPos- cameraY);
			}
			if(data.items[i].type == "arrows"){
				ctx.drawImage(arrow_icon, data.items[i].xPos - cameraX,data.items[i].yPos- cameraY);
			}
			if(data.items[i].type == "firstaid"){
				ctx.drawImage(first_aid_icon, data.items[i].xPos - cameraX,data.items[i].yPos- cameraY);
			}
			if(data.items[i].type == "empty_bottle"){
				ctx.drawImage(bottle_empty, data.items[i].xPos - cameraX,data.items[i].yPos- cameraY);
			}
			if(data.items[i].type == "full_bottle"){
				ctx.drawImage(bottle_full, data.items[i].xPos - cameraX,data.items[i].yPos - cameraY);
			}
			if(data.items[i].type == "meat"){
				ctx.drawImage(meat, data.items[i].xPos - cameraX,data.items[i].yPos - cameraY);
			}
			if(data.items[i].type == "land_mine"){
				ctx.drawImage(land_mine, data.items[i].xPos - cameraX,data.items[i].yPos - cameraY);
			}
			if(data.items[i].type == "bow"){
				ctx.drawImage(bow_icon, data.items[i].xPos - cameraX,data.items[i].yPos - cameraY);
			}
			if(data.items[i].type == "arrow"){
				ctx.drawImage(arrow_icon, data.items[i].xPos - cameraX,data.items[i].yPos - cameraY);
			}
		}

		for(var i = 0; i < data.creatures.length; i++){
			if(typeof data.creatures[i] !== 'undefined'){
			if(data.creatures[i].type == "WOLF"){
				ctx.drawImage(wolf, data.creatures[i].xPos - cameraX, data.creatures[i].yPos - cameraY);
			}else if(data.creatures[i].type == "PIG"){
				ctx.drawImage(pig, data.creatures[i].xPos - cameraX, data.creatures[i].yPos - cameraY);
			}

			ctx.fillStyle = "#000000";
			ctx.fillRect(data.creatures[i].xPos - cameraX - 31, data.creatures[i].yPos - cameraY - 11, 102, 7);

			ctx.fillStyle = "#FF0000";
			ctx.fillRect(data.creatures[i].xPos - cameraX - 30, data.creatures[i].yPos - cameraY - 10, (data.creatures[i].health/data.creatures[i].max_health)*100, 5);
			}
		}
		ctx.beginPath();
		ctx.arc(data.map_center_x - cameraX, data.map_center_y - cameraY, data.map_radius, 0, 2*Math.PI);
		ctx.stroke();
		ctx.arc(data.map_center_x - cameraX, data.map_center_y - cameraY, data.map_radius+50, 0, 2*Math.PI);
		ctx.stroke();

		for(var i = 0; i < data.players.length; i++){
			if(typeof data.players[i] !== 'undefined'){
				if(data.players[i].socket_id == my_socket_id){
					ctx.fillStyle = "#000000";
					ctx.fillRect(5+(window.innerWidth*0.75) - 225 * 0.75, 10 + window.innerHeight*0.25, 150, 21);

					ctx.fillStyle = "#FF0000";
					ctx.fillRect(5+(window.innerWidth*0.75) - 225 * 0.75 + 1, 11 + window.innerHeight*0.25, 148*(data.players[i].health/data.players[i].max_health), 19);

					ctx.fillStyle = "#000000";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75 + 75, 35 + window.innerHeight*0.25, 75, 14);

					ctx.fillStyle = "#0000FF";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75 + 75 + 1, 36 + window.innerHeight*0.25, 73*(data.players[i].stamina/data.players[i].max_stamina), 12);

					ctx.fillStyle = "#000000";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75, 65 + window.innerHeight*0.25, 150, 14);

					ctx.fillStyle = "#888800";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75 + 1, 66 + window.innerHeight*0.25, 148*(data.players[i].hunger/100), 12);

					ctx.fillStyle = "#000000";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75, 85 + window.innerHeight*0.25, 150, 14);

					ctx.fillStyle = "#33FF55";
					ctx.fillRect(5+ (window.innerWidth*0.75) - 225 * 0.75 + 1, 86 + window.innerHeight*0.25, 148*(data.players[i].thirst/100), 12);

					ctx.translate(c.width/2+20, c.height/2+20);
					ctx.rotate(data.players[i].aimDirection+2.356*0.8+data.players[i].attackAnimationStep/100);
					if(data.players[i].inventory[data.players[i].inventoryFocusIndex] == "dagger"){
						ctx.drawImage(dagger_icon, -40, -40);
					}
					if(data.players[i].inventory[data.players[i].inventoryFocusIndex] == "sword"){
						ctx.drawImage(sword_icon, -40, -40);
					}
					ctx.rotate(-data.players[i].aimDirection-2.356*0.8-data.players[i].attackAnimationStep/100);
					ctx.translate(-c.width/2-20, -c.height/2-20);

					ctx.fillStyle = "#000000";
					ctx.fillRect(5+(window.innerWidth*0.75) - 100 * 0.75 - 2, 130+window.innerHeight*0.25+data.players[i].inventoryFocusIndex*50 - 2, 44, 44);

					for(var j = 0; j < 5; j++){
						ctx.drawImage(item_holder_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						if(data.players[i].inventory[j] == "dagger"){
							ctx.drawImage(dagger_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "sword"){
							ctx.drawImage(sword_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "firstaid"){
							ctx.drawImage(first_aid_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "empty_bottle"){
							ctx.drawImage(bottle_empty, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "full_bottle"){
							ctx.drawImage(bottle_full, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "meat"){
							ctx.drawImage(meat, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "bow"){
							ctx.drawImage(bow_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
						if(data.players[i].inventory[j] == "arrow"){
							ctx.drawImage(arrow_icon, 5+(window.innerWidth*0.75) - 100 * 0.75, 130+window.innerHeight*0.25+j*50);
						}
					}

				}
			}
		}

		for(var i = 0; i < data.players.length; i++){
				drawRotatedImage(ctx, player_image, Math.PI/4, data.players[i].xPos - cameraX, data.players[i].yPos - cameraY, data.players[i].xPos - cameraX+20, data.players[i].yPos - cameraY+20 );
			

			ctx.fillStyle = "#000000";
			ctx.fillRect(data.players[i].xPos - cameraX - 31, data.players[i].yPos - cameraY - 11, 102, 7);

			ctx.fillStyle = "#FF0000";
			ctx.fillRect(data.players[i].xPos - cameraX - 30, data.players[i].yPos - cameraY - 10, (data.players[i].health/data.players[i].max_health)*100, 5);
		}
		for(var i = 0; i < data.projectiles.length; i++){
			var angle = Math.atan(data.projectiles[i].deltaY/data.projectiles[i].deltaX)
			if (data.projectiles[i].deltaX < 0) angle = Math.PI/2 - angle;
			ctx.save(); 

			
			  ctx.translate(data.projectiles[i].xPos-cameraX, data.projectiles[i].yPos-cameraY);

			  ctx.rotate(angle-Math.PI/4);

			 // draw it up and to the left by half the width
			 // and height of the image 
			 ctx.drawImage(arrow_icon, -20, -20);

			 // and restore the co-ords to how they were when we began
			  ctx.restore(); 
			
			
		}
	}else if(data.stage == "END"){
		brawn_points = 0;
		intelligence_points = 0;
		agility_points = 0;
		points_to_spend = 6;
	}
});

socket.on('game_over', function(winner){
	ctx.font="60px Georgia";
	ctx.fillStyle="#000000";
	ctx.fillText(winner + " won!", window.innerWidth/2-20*0.8*8, window.innerHeight/2-80);
});

socket.on('not_enough', function(){
	alert("Not enough players to join! The Arena is a multiplayer game! (you need 2 or more)");
	document.getElementById("submitButton").style.display = "block";
	brawn_points = 0;
	intelligence_points = 0;
	agility_points = 0;
	points_to_spend = 6;
});




//all client side visualization code goes over here :)
