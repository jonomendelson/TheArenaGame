var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var FRAME_RATE = 60.0;
var PORT_NUMBER = 3000;
var STATS_COUNTDOWN_LENGTH = 30;

var MAP_CENTER_X = 2000;
var MAP_CENTER_Y = 2000;
var MAP_SIZE_DECAY = 0.9998;

var HUNGER_LOSS = 0.015;
var THIRST_LOSS = 0.008;

var MALNOURISH_DAMAGE = 0.01;

var OBSTACLE_COUNT = 450;
var ITEM_COUNT = 80;
var CREATURE_COUNT = 50;

var BLOCK_SIZE = 40;

var BASE_PLAYER_MOVESPEED = 3;
var BASE_PLAYER_HEALTH = 100;
var BASE_PLAYER_STAMINA = 100;
var BASE_PLAYER_DAMAGE = 3;

var STAMINA_USAGE = 1.2;
var BASE_STAMINA_REGEN = 0.5;

var MAX_VISION_RADIUS = 600;

//item name, damage multiplier (over basic attack), seconds before reuse, range
var ITEM_STATS = [["", 1, 0.3, 90], ["dagger", 2, 0.4, 90], ["sword", 3, 0.7, 150], ["firstaid", 1, 0.8, 90], ["empty_bottle", 1, 0.8, 90], ["full_bottle", 1, 0.8, 90],  ["meat", 1, 0.8, 90]];

var WOLF_MOVE_SPEED = 3.5;
var PIG_MOVE_SPEED = 2;

var WOLF_DAMAGE = 0.25;

var CENTER_SIZE = 500;
var START_MAP_RADIUS = 2000;

var PLAYER_FRICTION = 0.95;
var WALL_BOUNCE = 10;
var WALL_DAMAGE = 25;

var FIRST_AID_HEAL = 20;

var game = {};

var map_radius = START_MAP_RADIUS;

var stage = "STATS";
var countdown = STATS_COUNTDOWN_LENGTH;

var gotIntoGame = false;
var didFinishLoading = false;

var players = [];
var obstacles = [];
var items = [];
var creatures = [];

var lobby_trigger;
var game_trigger;

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function distFrom(xOne, yOne, xTwo, yTwo){
	return Math.sqrt((xOne-xTwo)*(xOne-xTwo) + (yOne-yTwo)*(yOne-yTwo));
}

function handleLobby(){
	countdown--;
	console.log(countdown);
	if(countdown <= 0){
		console.log("STARTING GAME");
		clearInterval(lobby_trigger);
		generateMap(map_radius);
		console.log("LOOPING NOW...");
		for(var i = 0; i < players.length; i++){
			console.log("FIXED PLAYER " + i);
			if(typeof players[i] !== 'undefined'){
				players[i].xPos = MAP_CENTER_X; //(Math.cos(angle_space + angle_space*i))*CENTER_SIZE*0.8 + MAP_CENTER_X;
				players[i].yPos = MAP_CENTER_Y; //(Math.sin(angle_space + angle_space*i))*CENTER_SIZE*0.8 + MAP_CENTER_Y;
			}
		}
		console.log("MADE IT TO GAMEPLAY");
		didFinishLoading = true;
		stage = "GAMEPLAY";
	}
}

function addNewPlayer(socket_id, username, brawn_points, intelligence_points, agility_points){ //add: check for manipulation client-side
	var player = {};
	player.socket_id = socket_id;
	player.username = username;

	console.log("added: " + username);
	
	player.brawn_points = brawn_points;
	player.intelligence_points = intelligence_points;
	player.agility_points = agility_points;
	
	player.windowWidth = 500;
	player.windowHeight = 500;
	
	player.xPos = 0;
	player.yPos = 0;

	player.xVel = 0;
	player.yVel = 0;
	
	player.aimDirection = 0;
	
	player.mouseX = 0;
	player.mouseY = 0;
	player.isMouseDown = false;
	player.isRightDown = false;
	player.isLeftDown = false;
	player.isUpDown = false;
	player.isDownDown = false;
	player.isShiftDown = false;
	player.isSpaceDown = false;
	player.isEDown = false;
	player.isEnterDown = false;
	player.isOneDown = false;
	player.isTwoDown = false;
	player.isThreeDown = false;
	player.isFourDown = false;
	player.isFiveDown = false;
	
	player.max_health = BASE_PLAYER_HEALTH + player.brawn_points*6;
	player.health = player.max_health;
	
	player.base_damage = BASE_PLAYER_DAMAGE + player.brawn_points*0.2;
	
	player.max_stamina = BASE_PLAYER_STAMINA + player.agility_points*15;
	player.stamina = player.max_stamina;
	player.stamina_regen = BASE_STAMINA_REGEN;
	
	player.movespeed = BASE_PLAYER_MOVESPEED + player.agility_points*0.3;
	
	player.inventory = ["", "", "", "", ""];
	player.inventoryFocusIndex = 0;
	
	player.hunger = 100;
	player.thirst = 100;
	
	player.attackAnimationStep = 0;
	
	player.player_knowledge = {};
	
	players.push(player);
}

function getPlayerById(socket_id){
	for(var i = 0; i < players.length; i++){
		if(typeof players[i] !== 'undefined'){
			if(players[i].socket_id == socket_id){
				return i;
			}
		}
	}
}

function getItem(name){
	for(var i = 0; i < ITEM_STATS.length; i++){
		if(ITEM_STATS[i][0] == name){
			return i;
		}
	}
}

function solvePhysics(){
	if(didFinishLoading){map_radius *= MAP_SIZE_DECAY;}
		
	for(var n = 0; n < creatures.length; n++){
		creatureAI(creatures[n]);
	}

	if(stage == "GAMEPLAY" && players.length > 1){
		gotIntoGame = true;
	}
	
	for(var n = 0; n < creatures.length; n++){
		if(distFrom(creatures[n].xPos, creatures[n].yPos, MAP_CENTER_X, MAP_CENTER_Y) > map_radius+120){
			delete creatures[n];
		}
	}
	
	for(var n = 0; n < items.length; n++){
		if(distFrom(items[n].xPos, items[n].yPos, MAP_CENTER_X, MAP_CENTER_Y) > map_radius+120){
			delete items[n];
		}
	}
	
	for(var n = 0; n < obstacles.length; n++){
		if(distFrom(obstacles[n].xPos, obstacles[n].yPos, MAP_CENTER_X, MAP_CENTER_Y) > map_radius+120){
			delete obstacles[n];
		}
	}
	
	creatures.clean(undefined);
	items.clean(undefined);
	obstacles.clean(undefined);
	
	if(stage == "GAMEPLAY"){
		if(!gotIntoGame){
			console.log("NOT ENOUGH!");
			map_radius = START_MAP_RADIUS;
			didFinishLoading = false;
			io.emit('not_enough');
			stage = "STATS";
			countdown = STATS_COUNTDOWN_LENGTH;
			lobby_trigger = setInterval(function(){handleLobby();}, 1000);
			gotIntoGame = false;
			obstacles = [];
			items = [];
			creatures = [];
		}else{
			if(players.length <= 1){
			players.clean(undefined);
				
			stage = "END";
			gotIntoGame = false;
			didFinishLoading = false;
			map_radius = START_MAP_RADIUS;

			if(typeof players[0] !== 'undefined'){
				io.emit('game_over', players[0].username);
			}
			setTimeout(function(){stage = "STATS"; players = []; creatures = []; items = []; obstacles = []; map_radius = 2000; countdown = STATS_COUNTDOWN_LENGTH; lobby_trigger = setInterval(function(){handleLobby();}, 1000);}, 10000);
			}
		}
	}

	
	for(var i = 0; i < players.length; i++){
		if(typeof players[i] !== 'undefined'){
			if(distFrom((players[i].xPos+20), (players[i].yPos+20), MAP_CENTER_X, MAP_CENTER_Y) > map_radius-20){
				if(stage == "GAMEPLAY"){
					var deltaX = players[i].xPos - MAP_CENTER_X;
					var deltaY = players[i].yPos - MAP_CENTER_Y;
					
					var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
					
					var unitX = deltaX/distance;
					var unitY = deltaY/distance;
					
					players[i].xVel = -unitX * WALL_BOUNCE;
					players[i].yVel = -unitY * WALL_BOUNCE;

					console.log("-unitX:" + -unitX);
					console.log("-unitY:" + -unitY);
					
					players[i].xPos = MAP_CENTER_X + unitX * (map_radius-18) - 20;
					players[i].yPos = MAP_CENTER_Y + unitY * (map_radius-18) - 20;

					players[i].health -= WALL_DAMAGE;
				}
			}

			var oldx = players[i].xPos;
			var oldy = players[i].yPos;	

			players[i].xPos += players[i].xVel;
			players[i].yPos += players[i].yVel;

			players[i].xVel *= PLAYER_FRICTION;
			players[i].yVel *= PLAYER_FRICTION;

			players[i].hunger = Math.max(players[i].hunger-HUNGER_LOSS, 0);
			players[i].thirst = Math.max(players[i].thirst-THIRST_LOSS, 0);
			
			if(players[i].hunger <= 10){
				players[i].health -= MALNOURISH_DAMAGE;
			}
			
			if(players[i].thirst <= 10){
				players[i].health -= MALNOURISH_DAMAGE;
			}
			
			players[i].aimDirection = Math.atan2(players[i].mouseY - players[i].windowHeight/2, players[i].mouseX - players[i].windowWidth/2);
			players[i].stamina = Math.min(players[i].max_stamina, players[i].stamina+players[i].stamina_regen);

			for(var j = 0; j < obstacles.length; j++){
				if(typeof obstacles[j] !== 'undefined'){
					if(obstacles[j].type == "TREE"){
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 57) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 57)){
								players[i].xPos = oldx;
								players[i].yPos = oldy;
								players[i].xVel = 0;
								players[i].yVel = 0;
						}
					}else{
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 39) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 39)){
								players[i].xPos = oldx;
								players[i].yPos = oldy;
								players[i].xVel = 0;
								players[i].yVel = 0;
						}
					}

				}
			}

			
			
			if(players[i].isShiftDown && players[i].stamina >= STAMINA_USAGE){
				if(players[i].isRightDown) players[i].xPos += (players[i].movespeed * 2);
				if(players[i].isLeftDown) players[i].xPos -= (players[i].movespeed * 2);
				players[i].stamina = Math.max(0, players[i].stamina-STAMINA_USAGE);
			}else{
				if(players[i].isRightDown) players[i].xPos += players[i].movespeed;
				if(players[i].isLeftDown) players[i].xPos -= players[i].movespeed;
			}
			
			for(var j = 0; j < obstacles.length; j++){
				if(typeof obstacles[j] !== 'undefined'){
					if(obstacles[j].type == "TREE"){
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 57) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 57)){
							if(players[i].isLeftDown || players[i].isRightDown){
								players[i].xPos = oldx;
							}
						}
					}else{
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 39) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 39)){
							if(players[i].isLeftDown || players[i].isRightDown){
								players[i].xPos = oldx;
							}
						}
					}
				}
			}
			
			if(players[i].isShiftDown && players[i].stamina >= STAMINA_USAGE){
				if(players[i].isUpDown) players[i].yPos -= (players[i].movespeed * 2);
				if(players[i].isDownDown) players[i].yPos += (players[i].movespeed * 2);
				players[i].stamina = Math.max(0, players[i].stamina-STAMINA_USAGE);
			}else{
				if(players[i].isUpDown) players[i].yPos -= players[i].movespeed;
				if(players[i].isDownDown) players[i].yPos += players[i].movespeed;
			}
			
			for(var j = 0; j < obstacles.length; j++){
				if(typeof obstacles[j] !== 'undefined'){
					if(obstacles[j].type == "TREE"){
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 57) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 57)){
							if(players[i].isUpDown || players[i].isDownDown){
								players[i].yPos = oldy;
							}
						}
					}else{
						if((Math.abs(players[i].xPos - obstacles[j].xPos) < 39) && (Math.abs(players[i].yPos - obstacles[j].yPos) < 39)){
							if(players[i].isUpDown || players[i].isDownDown){
								players[i].yPos = oldy;
							}
						}
					}
				}
			}	

			if(players[i].attackAnimationStep == 4){
				for(var j = 0; j < players.length; j++){
					if(typeof players[j] !== 'undefined'){
						if(i != j){
							var distance = distFrom(players[i].xPos, players[i].yPos, players[j].xPos, players[j].yPos);
							var angle = Math.atan2(players[j].yPos - players[i].yPos, players[j].xPos - players[i].xPos);
							if(distance < ITEM_STATS[getItem(players[i].inventory[players[i].inventoryFocusIndex])][3]){
								if(Math.abs(angle - players[i].aimDirection) < 0.6){
									players[j].health -= players[i].base_damage * ITEM_STATS[getItem(players[i].inventory[players[i].inventoryFocusIndex])][1];
								}
							}
						}
					}
				}
				for(var j = 0; j < creatures.length; j++){
					if(typeof creatures[j] !== 'undefined'){
						if(i != j){
							var distance = distFrom(players[i].xPos, players[i].yPos, creatures[j].xPos, creatures[j].yPos);
							var angle = Math.atan2(creatures[j].yPos - players[i].yPos, creatures[j].xPos - players[i].xPos);
							if(distance < ITEM_STATS[getItem(players[i].inventory[players[i].inventoryFocusIndex])][3]){
								if(Math.abs(angle - players[i].aimDirection) < 0.6){
									creatures[j].health -= players[i].base_damage * ITEM_STATS[getItem(players[i].inventory[players[i].inventoryFocusIndex])][1];
								}
							}
						}
					}
				}
			}
			
			if(players[i].attackAnimationStep != 0){
				if(players[i].attackAnimationStep > ITEM_STATS[getItem(players[i].inventory[players[i].inventoryFocusIndex])][2]*(60-2*players[i].intelligence_points)){
					players[i].attackAnimationStep = 0;
				}else{
					players[i].attackAnimationStep++;
				}
			}
			
			if(players[i].isMouseDown){
				if(players[i].attackAnimationStep == 0){
					players[i].attackAnimationStep = 1;
				}
			}
			
			if(players[i].isOneDown){
				players[i].inventoryFocusIndex = 0;
			}
			if(players[i].isTwoDown){
				players[i].inventoryFocusIndex = 1;
			}
			if(players[i].isThreeDown){
				players[i].inventoryFocusIndex = 2;
			}
			if(players[i].isFourDown){
				players[i].inventoryFocusIndex = 3;
			}
			if(players[i].isFiveDown){
				players[i].inventoryFocusIndex = 4;
			}
			
			if(players[i].isSpaceDown){
				if(players[i].inventory[players[i].inventoryFocusIndex] == ""){
					for(var j = 0; j < items.length; j++){
						if(Math.abs(players[i].xPos - items[j].xPos) < 40 && Math.abs(players[i].yPos - items[j].yPos) < 40){
							players[i].inventory[players[i].inventoryFocusIndex] = items[j].type;
							delete items[j];
						}
					}
				}
			}

		//	console.log("Players: " + players.length + " and Stage: " + stage);
			
			if(players[i].isEDown){ //fix
				var item = {};
				item.xPos = Math.round(players[i].xPos/BLOCK_SIZE)*BLOCK_SIZE;
				item.yPos = Math.round(players[i].yPos/BLOCK_SIZE)*BLOCK_SIZE;
				item.type = players[i].inventory[players[i].inventoryFocusIndex];
				if(item.type != ""){
					items.push(item);
				}
				players[i].inventory[players[i].inventoryFocusIndex] = "";
			}
			
			if(players[i].isEnterDown){
				if(players[i].inventory[players[i].inventoryFocusIndex] == "firstaid"){
					players[i].health = Math.min(players[i].max_health, players[i].health += FIRST_AID_HEAL);
					players[i].inventory[players[i].inventoryFocusIndex] = "";
				}
				if(players[i].inventory[players[i].inventoryFocusIndex] == "full_bottle"){
					players[i].thirst = Math.min(100, players[i].thirst+20);
					players[i].inventory[players[i].inventoryFocusIndex] = "empty_bottle";
				}
				if(players[i].inventory[players[i].inventoryFocusIndex] == "meat"){
					players[i].hunger = Math.min(100, players[i].hunger+20);
					players[i].inventory[players[i].inventoryFocusIndex] = "";
				}
			}
			
			for(var n = 0; n < creatures.length; n++){
				if(typeof creatures[n] !== 'undefined'){
					if(Math.abs(creatures[n].xPos - players[i].xPos) < 40 && Math.abs(creatures[n].yPos - players[i].yPos) < 40){
						if(creatures[n].type == "WOLF" && (creatures[n].health != creatures[n].max_health)){
							players[i].health -= WOLF_DAMAGE;
						}
					}
					if(creatures[n].health <= 0){
						var food = {};
						food.xPos = creatures[n].xPos;
						food.yPos = creatures[n].yPos;
						food.type = "meat";
						items.push(food);
						delete creatures[n];
					}
				}
			}
			
			if(players[i].health <= 0){
				delete players[i];
			}
			
			
			
			players.clean(undefined);
			obstacles.clean(undefined);
			items.clean(undefined);
			creatures.clean(undefined);
		}
	}
}

function creatureAI(creature){
	if(typeof creature !== 'undefined' && players.length > 0){
	if(creature.health == creature.max_health){
		if(creature.type == "WOLF"){
			if(distFrom(creature.xPos, creature.yPos, creature.targetX, creature.targetY) < 20){
				var targetX = Math.random()*2 - 1;
				var targetY = Math.random()*2 - 1;
			
				var distance = Math.sqrt(targetX*targetX + targetY*targetY);
			
				var unitX = targetX/distance;
				var unitY = targetY/distance;
				
			
				creature.targetX = creature.xPos + unitX*160;
				creature.targetY = creature.yPos + unitY*160;
				creature.unitX = unitX;
				creature.unitY = unitY;
			}	
			creature.xPos += creature.unitX * WOLF_MOVE_SPEED/2;
			creature.yPos += creature.unitY * WOLF_MOVE_SPEED/2;
		}
	}else{
		if(creature.type == "WOLF"){
			var deltaX = (creature.xPos-nearestPlayer(creature).xPos);
			var deltaY = (creature.yPos-nearestPlayer(creature).yPos);
			var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
		
			var unitX = deltaX/distance;
			var unitY = deltaY/distance;
		
			creature.xPos -= unitX * WOLF_MOVE_SPEED;
			creature.yPos -= unitY * WOLF_MOVE_SPEED;
			
			creature.direction = Math.atan2(creature.yPos - nearestPlayer(creature).yPos, creature.xPos - nearestPlayer(creature).xPos);
		}
		if(creature.type == "PIG"){
			var deltaX = (creature.xPos-nearestPlayer(creature).xPos);
			var deltaY = (creature.yPos-nearestPlayer(creature).yPos);
			var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
		
			var unitX = deltaX/distance;
			var unitY = deltaY/distance;
		
			creature.xPos += unitX * PIG_MOVE_SPEED;
			creature.yPos += unitY * PIG_MOVE_SPEED;
			
			creature.direction = Math.atan2(creature.yPos - nearestPlayer(creature).yPos, creature.xPos - nearestPlayer(creature).xPos);
			
		}
	}
	}
}

function nearestPlayer(creature){
	if(typeof creature !== 'undefined'){
	if(players[0] !== 'undefined'){
	var closest_player = players[0];
	for (var i = 0; i < players.length; i++){
		if(typeof players[i] !== 'undefined'){
			if (distFrom(creature.xPos, creature.yPos, players[i].xPos, players[i].yPos) <= distFrom(creature.xPos, creature.yPos, closest_player.xPos, closest_player.yPos)) closest_player = players[i];
		}
	}
	return closest_player;
	}
	}
}

function addNewCreature(type, mapRadius){
	var creature = {};
	creature.xPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
	creature.yPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
	creature.max_health = 50;
	creature.health = creature.max_health;
	creature.type = type;
	creature.direction = 0;
	creature.targetX = creature.xPos;
	creature.targetY = creature.yPos;
	creature.unitX = 0;
	creature.unitY = 0;
	creatures.push(creature);
}

function addNewObstacle(type, mapRadius){
	var obstacle = {};
	obstacle.xPos = 0;
	obstacle.yPos = 0;
	var isOk = false;
	var canBeReleased = false;
	while(distFrom(MAP_CENTER_X, MAP_CENTER_Y, obstacle.xPos, obstacle.yPos) > mapRadius){
		canBeReleased = false;
		while(!canBeReleased){
			obstacle.xPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
			obstacle.yPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
		
			isOk = true;
			for(var i = 0; i < obstacles.length; i++){
				if(Math.abs(obstacle.xPos - obstacles[i].xPos) < 90 && Math.abs(obstacle.yPos - obstacles[i].yPos) < 90){
					isOk = false;
				}
			}
			
			if(isOk){
				canBeReleased = true;
			}
		}
	}
	obstacle.type = type;
	obstacles.push(obstacle);
}

function addNewItem(type, mapRadius){
	var item = {};
	item.xPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
	item.yPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
	var isOk = false;
	var canBeReleased = false;
	while(distFrom(MAP_CENTER_X, MAP_CENTER_Y, item.xPos, item.yPos) > mapRadius){
		canBeReleased = false;
		while(!canBeReleased){
			item.xPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
			item.yPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
		
			isOk = true;
			for(var i = 0; i < obstacles.length; i++){
				if(Math.abs(item.xPos - obstacles[i].xPos) < 90 && Math.abs(item.yPos - obstacles[i].yPos) < 90){
					isOk = false;
				}
			}
			for(var i = 0; i < items.length; i++){
				if(Math.abs(item.xPos - items[i].xPos) < 90 && Math.abs(item.yPos - items[i].yPos) < 90){
					isOk = false;
				}
			}
			
			if(isOk){
				canBeReleased = true;
			}
		}
	}
	
	item.type = type;
	items.push(item);
	
}

function addNewItemAt(type, xPos, yPos, mapRadius){
	var item = {};
	item.xPos = xPos;
	item.yPos = yPos;
	var isOk = false;
	var canBeReleased = false;
	while(distFrom(MAP_CENTER_X, MAP_CENTER_Y, item.xPos, item.yPos) > mapRadius){
		canBeReleased = false;
		while(!canBeReleased){
			item.xPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
			item.yPos = Math.round((Math.random()*map_radius*2)/BLOCK_SIZE)*BLOCK_SIZE;
		
			isOk = true;
			for(var i = 0; i < obstacles.length; i++){
				if(Math.abs(item.xPos - obstacles[i].xPos) < 90 && Math.abs(item.yPos - obstacles[i].yPos) < 90){
					isOk = false;
				}
			}
			for(var i = 0; i < items.length; i++){
				if(Math.abs(item.xPos - items[i].xPos) < 90 && Math.abs(item.yPos - items[i].yPos) < 90){
					isOk = false;
				}
			}
			
			if(isOk){
				canBeReleased = true;
			}
		}
	}
	
	
	item.type = type;
	items.push(item);
	
}

function generateMap(mapRadius){
	console.log("MY MAP RAD:" + mapRadius);
	for(var i = 0; i < OBSTACLE_COUNT; i++){
		if(i % 3 == 0 || i % 3 == 1){
			addNewObstacle("TREE", mapRadius);
		}else if(i % 3 == 2){
			addNewObstacle("ROCK", mapRadius);
		}
	}
	for(var i = 0; i < ITEM_COUNT; i++){
		var randomNum = 0;
		console.log("Item started as: " + ITEM_STATS[randomNum][0]);
		while(ITEM_STATS[randomNum][0] == ""){
			randomNum = Math.floor(Math.random()*ITEM_STATS.length);
			console.log("Item changed to: " + ITEM_STATS[randomNum][0]);
		}
		addNewItem(ITEM_STATS[randomNum][0], mapRadius);
		console.log("Added item: " + ITEM_STATS[randomNum][0]);
	}
	
	for(var i = 0; i < CREATURE_COUNT/2; i++){
		addNewCreature("WOLF", mapRadius);
		addNewCreature("PIG", mapRadius);
	}
	
	for(var i = 0; i < OBSTACLE_COUNT; i++){
		if(distFrom(obstacles[i].xPos, obstacles[i].yPos, MAP_CENTER_X, MAP_CENTER_Y) < CENTER_SIZE){
			delete obstacles[i];
		}
	}
	
	for(var i = 0; i < ITEM_COUNT; i++){
		if(distFrom(items[i].xPos, items[i].yPos, MAP_CENTER_X, MAP_CENTER_Y) < CENTER_SIZE){
			delete items[i];
		}
	}
	
	for(var i = 0; i < CREATURE_COUNT/2; i++){
		if(distFrom(creatures[i].xPos, creatures[i].yPos, MAP_CENTER_X, MAP_CENTER_Y) < CENTER_SIZE){
			delete creatures[i];
		}
	}
	
	for(var i = 0; i < 15; i++){
		var randomNum = 0;
		while(ITEM_STATS[randomNum][0] == ""){
			randomNum = Math.floor(Math.random()*ITEM_STATS.length);
		}
		addNewItemAt(ITEM_STATS[randomNum][0], -125+MAP_CENTER_X+Math.round((Math.random()*250*2)/BLOCK_SIZE)*BLOCK_SIZE, -125+MAP_CENTER_Y+Math.round((Math.random()*250*2)/BLOCK_SIZE)*BLOCK_SIZE, mapRadius);
	}
	
	players.clean(undefined);
	obstacles.clean(undefined);
	items.clean(undefined);
	creatures.clean(undefined);
	
}

function createEdge(vertex_a, vertex_b, player, parent_object){
	var edge = {};
	edge.vertex_a = vertex_a;
	edge.vertex_b = vertex_b;
	edge.midpoint = {xPos: (vertex_a.xPos+vertex_b.xPos)/2, yPos: (vertex_a.yPos + vertex_b.yPos)/2};
	edge.distance = distFrom(edge.midpoint.xPos, edge.midpoint.yPos, player.xPos, player.yPos);
	edge.parent_object = parent_object;
	return edge;
}

function createVertex(xPos, yPos){
	var vertex = {};
	vertex.xPos = xPos;
	vertex.yPos = yPos;
	return vertex;
}

function createShadow(origin_vertex, cast_vertex_a, cast_vertex_b){
	var shadow = {};
	shadow.origin_vertex = origin_vertex;
	shadow.cast_vertex_a = cast_vertex_a;
	shadow.cast_vertex_b = cast_vertex_b;
	return shadow;
}

function onSegment(p, q, r)
{
    if (q.xPos <= Math.max(p.xPos, r.xPos) && q.xPos >= Math.min(p.xPos, r.xPos) && q.yPos <= Math.max(p.yPos, r.yPos) && q.yPos >= Math.min(p.yPos, r.yPos)) return true;
    return false;
}
 
function orientation(p, q, r)
{
    var val = (q.yPos - p.yPos) * (r.xPos - q.xPos) -(q.xPos - p.xPos) * (r.yPos - q.yPos);
 
    if (val == 0) return 0;  // colinear
 
    return (val > 0)? 1: 2; // clock or counterclock wise
}
 
function doIntersect(p1, q1, p2, q2){
    // Find the four orientations needed for general and
    // special cases
    var o1 = orientation(p1, q1, p2);
    var o2 = orientation(p1, q1, q2);
    var o3 = orientation(p2, q2, p1);
    var o4 = orientation(p2, q2, q1);
 
    // General case
    if (o1 != o2 && o3 != o4)return true;
 
    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
 
    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
 
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
 
     // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
 
    return false; // Doesn't fall in any of the above cases
}

function isHiddenByShadow(currEdge, currObject, objectSize, q, offset){
	var doesUpperLeft = doIntersect(createVertex(players[q].xPos+BLOCK_SIZE/2, players[q].yPos+BLOCK_SIZE/2), createVertex(currObject.xPos + offset, currObject.yPos + offset), currEdge.vertex_a, currEdge.vertex_b);
	var doesUpperRight = doIntersect(createVertex(players[q].xPos+BLOCK_SIZE/2, players[q].yPos+BLOCK_SIZE/2), createVertex(currObject.xPos + objectSize + offset, currObject.yPos + offset), currEdge.vertex_a, currEdge.vertex_b);
	var doesLowerLeft = doIntersect(createVertex(players[q].xPos+BLOCK_SIZE/2, players[q].yPos+BLOCK_SIZE/2), createVertex(currObject.xPos + offset, currObject.yPos + objectSize + offset), currEdge.vertex_a, currEdge.vertex_b);
	var doesLowerRight = doIntersect(createVertex(players[q].xPos+BLOCK_SIZE/2, players[q].yPos+BLOCK_SIZE/2), createVertex(currObject.xPos + objectSize + offset, currObject.yPos + objectSize + offset), currEdge.vertex_a, currEdge.vertex_b);
	return doesUpperLeft || doesUpperRight || doesLowerLeft || doesLowerRight;
}
 

function packageAllGameData(q){
		var player_knowledge = {};
				
		var player_obstacles = [];
		var player_players = [];
		var player_items = [];
		var player_creatures = [];
				
		var vertices = [];
		var edges = [];
		var shadows = [];
				
		for(var r = 0; r < players.length; r++){ //add to player knowledge any players in vision radius and add their edges (except don't add player's own edges)
			if(distFrom(players[r].xPos, players[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
				player_players.push(players[r]);
				if(r !== q){
					var vertex1 = createVertex(players[r].xPos, players[r].yPos);
					vertices.push(vertex1);
					var vertex2 = createVertex(players[r].xPos + BLOCK_SIZE, players[r].yPos);
					vertices.push(vertex2);
					var vertex3 = createVertex(players[r].xPos + BLOCK_SIZE, players[r].yPos + BLOCK_SIZE);
					vertices.push(vertex3);
					var vertex4 = createVertex(players[r].xPos, players[r].yPos + BLOCK_SIZE);
					vertices.push(vertex4);		

					edges.push(createEdge(vertex1, vertex2, players[q], players[r]));
					edges.push(createEdge(vertex2, vertex3, players[q], players[r]));
					edges.push(createEdge(vertex3, vertex4, players[q], players[r]));
					edges.push(createEdge(vertex4, vertex1, players[q], players[r]));
				}
			}
		}
				
		for(var r = 0; r < creatures.length; r++){ //add to player knowledge any creatures in vision radius and add their edges
			if(distFrom(creatures[r].xPos, creatures[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
				player_creatures.push(creatures[r]);
				var vertex1 = createVertex(creatures[r].xPos, creatures[r].yPos);
				vertices.push(vertex1);
				var vertex2 = createVertex(creatures[r].xPos + BLOCK_SIZE, creatures[r].yPos);
				vertices.push(vertex2);
				var vertex3 = createVertex(creatures[r].xPos+BLOCK_SIZE, creatures[r].yPos + BLOCK_SIZE);
				vertices.push(vertex3);
				var vertex4 = createVertex(creatures[r].xPos, creatures[r].yPos + BLOCK_SIZE);
				vertices.push(vertex4);		

				edges.push(createEdge(vertex1, vertex2, players[q], creatures[r]));
				edges.push(createEdge(vertex2, vertex3, players[q], creatures[r]));
				edges.push(createEdge(vertex3, vertex4, players[q], creatures[r]));
				edges.push(createEdge(vertex4, vertex1, players[q], creatures[r]));
			}
		}
				
		for(var r = 0; r < obstacles.length; r++){ //add to player knowledge any obstacles in vision radius and add their edges
			if(distFrom(obstacles[r].xPos, obstacles[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
				player_obstacles.push(obstacles[r]);
				if(obstacles[r].type == "TREE"){
					var vertex1 = createVertex(obstacles[r].xPos - BLOCK_SIZE*0.5, obstacles[r].yPos - BLOCK_SIZE*0.5);
					vertices.push(vertex1);
					var vertex2 = createVertex(obstacles[r].xPos - BLOCK_SIZE*0.5 + BLOCK_SIZE*2, obstacles[r].yPos - BLOCK_SIZE*0.5);
					vertices.push(vertex2);
					var vertex3 = createVertex(obstacles[r].xPos - BLOCK_SIZE*0.5 + BLOCK_SIZE*2, obstacles[r].yPos - BLOCK_SIZE*0.5 + BLOCK_SIZE*2);
					vertices.push(vertex3);
					var vertex4 = createVertex(obstacles[r].xPos - BLOCK_SIZE*0.5, obstacles[r].yPos - BLOCK_SIZE*0.5 + BLOCK_SIZE*2);
					vertices.push(vertex4);		

					edges.push(createEdge(vertex1, vertex2, players[q], obstacles[r]));
					edges.push(createEdge(vertex2, vertex3, players[q], obstacles[r]));
					edges.push(createEdge(vertex3, vertex4, players[q], obstacles[r]));
					edges.push(createEdge(vertex4, vertex1, players[q], obstacles[r]));
				}else{
					var vertex1 = createVertex(obstacles[r].xPos, obstacles[r].yPos);
					vertices.push(vertex1);
					var vertex2 = createVertex(obstacles[r].xPos + BLOCK_SIZE, obstacles[r].yPos);
					vertices.push(vertex2);
					var vertex3 = createVertex(obstacles[r].xPos+BLOCK_SIZE, obstacles[r].yPos+BLOCK_SIZE);
					vertices.push(vertex3);
					var vertex4 = createVertex(obstacles[r].xPos, obstacles[r].yPos+BLOCK_SIZE);
					vertices.push(vertex4);		

					edges.push(createEdge(vertex1, vertex2, players[q], obstacles[r]));
					edges.push(createEdge(vertex2, vertex3, players[q], obstacles[r]));
					edges.push(createEdge(vertex3, vertex4, players[q], obstacles[r]));
					edges.push(createEdge(vertex4, vertex1, players[q], obstacles[r]));
				}
			}
		}
		
		for(var r = 0; r < items.length; r++){ //add to player knowledge any items in vision radius
			if(distFrom(items[r].xPos, items[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
				player_items.push(items[r]);
			}
		}
				
		edges.sort(function(a, b){ //sort edges by distance
 				return a.distance-b.distance;
		});
		
		for(var r = 0; r < player_players.length; r++){ //delete any edges that are too close to current player (that originate from other players)
			if(typeof player_players[r] !== "undefined"){
				
				for(var s = 0; s < player_players.length; s++){
					if(typeof player_players[s] !== "undefined"){
						if(s !== r){
							if(distFrom(player_players[r].xPos, player_players[r].yPos, player_players[s].xPos, player_players[s].yPos) < BLOCK_SIZE*1.5){
								for(var t = 0; t < edges.length; t++){
									if(typeof edges[t] !== 'undefined'){
										if(edges[t].parent_object == player_players[r]){
											delete edges[t];
										}
									}
								}
							}
						}
					}
				}
				
			}
		}
		edges.clean(undefined);
		
		for(var r = 0; r < player_creatures.length; r++){ //delete any edges that are too close to current player
			if(typeof player_creatures[r] !== "undefined"){
				
				for(var s = 0; s < player_players.length; s++){
					if(typeof player_players[s] !== "undefined"){

							if(distFrom(player_creatures[r].xPos, player_creatures[r].yPos, player_players[s].xPos, player_players[s].yPos) < BLOCK_SIZE*1.5){
								for(var t = 0; t < edges.length; t++){
									if(typeof edges[t] !== 'undefined'){
										if(edges[t].parent_object == player_creatures[r]){
											delete edges[t];
										}
									}
								}
							}
						
					}
				}
				
			}
		}
		edges.clean(undefined);
		
		for(var r = edges.length-1; r >= 0; r--){ //delete any edges that are hidden by other edges
			if(typeof edges[r] !== "undefined"){
				
				for(var s = 0; s < edges.length; s++){
					if(typeof edges[s] !== "undefined"){
						if(s != r){
							if(doIntersect(createVertex(players[q].xPos+BLOCK_SIZE/2, players[q].yPos+BLOCK_SIZE/2), createVertex(edges[r].midpoint.xPos, edges[r].midpoint.yPos), edges[s].vertex_a, edges[s].vertex_b)){
								delete edges[r];
								s = edges.length;
							}
						}
					}
				}
				
			}
		}

		edges.clean(undefined);
		
		for(var r = 0; r < player_players.length; r++){ //remove any other players that are hidden by an edge (and remove their edges) - note: other players can't be removed by their own edges 
			if(player_players[r] != players[q]){ //dont run anything that could remove current player
				for(var s = 0; s < edges.length; s++){
					if(typeof edges[s] !== 'undefined' && typeof player_players[r] !== 'undefined'){
						if(isHiddenByShadow(edges[s], player_players[r], BLOCK_SIZE, q, 0)){
							if(edges[s].parent_object != player_players[r]){ //make sure the edge that is blocking the other player isn't the other player's own edge
								for(var t = 0; t < edges.length; t++){
									if(typeof edges[t] !== 'undefined'){
										if(edges[t].parent_object == player_players[r]){ //remove all edges that the hidden other player owns
											delete edges[t];
										}
									}
								}
								delete player_players[r];
										
							}
						}
					}
				}
			}
		}
		
		edges.clean(undefined);
		player_players.clean(undefined);
		
		for(var r = 0; r < player_creatures.length; r++){ //remove any creatures that are hidden by an edge (and remove their edges) - note: other creatures can't be removed by their own edges 
				for(var s = 0; s < edges.length; s++){
					if(typeof edges[s] !== 'undefined' && typeof player_creatures[r] !== 'undefined'){
						if(isHiddenByShadow(edges[s], player_creatures[r], BLOCK_SIZE, q, 0)){
							if(edges[s].parent_object != player_creatures[r]){ //make sure the edge that is blocking the creature isn't the creature's own edge
								for(var t = 0; t < edges.length; t++){
									if(typeof edges[t] !== 'undefined'){
										if(edges[t].parent_object == player_creatures[r]){ //remove all edges that the hidden creature owns
											delete edges[t];
										}
									}
								}
								delete player_creatures[r];
										
							}
						}
					}
				}
		}
		
		edges.clean(undefined);
		player_creatures.clean(undefined);
		
		for(var r = 0; r < player_obstacles.length; r++){ //remove any obstacles that are hidden by an edge (and remove their edges) - note: obstacles can't be removed by their own edges 
				for(var s = 0; s < edges.length; s++){
					if(typeof edges[s] !== 'undefined' && typeof player_obstacles[r] !== 'undefined'){
						if(player_obstacles[r].type == "TREE"){ //important for doIntersect: need to adjust point for segment (center is in a different place if obstacle is a tree)
							if(isHiddenByShadow(edges[s], player_obstacles[r], BLOCK_SIZE*2, q, -BLOCK_SIZE/2)){
								if(edges[s].parent_object != player_obstacles[r]){ //make sure the edge that is blocking the obstacle isn't the obstacle's own edge
									for(var t = 0; t < edges.length; t++){
										if(typeof edges[t] !== 'undefined'){
											if(edges[t].parent_object == player_obstacles[r]){ //remove all edges that the hidden obstacle owns
												delete edges[t];
											}
										}
									}
									delete player_obstacles[r];		
								}
							}
						}else{ //obstacle is normal size
							if(isHiddenByShadow(edges[s], player_obstacles[r], BLOCK_SIZE, q, 0)){
								if(edges[s].parent_object != player_obstacles[r]){ //make sure the edge that is blocking the obstacle isn't the obstacle's own edge
									for(var t = 0; t < edges.length; t++){
										if(typeof edges[t] !== 'undefined'){
											if(edges[t].parent_object == player_obstacles[r]){ //remove all edges that the hidden obstacle owns
												delete edges[t];
											}
										}
									}
									delete player_obstacles[r];		
								}
							}
						}
					}
				}
		}
		
		edges.clean(undefined);
		player_obstacles.clean(undefined);
		
		for(var r = 0; r < player_items.length; r++){ //remove any items that are hidden by an edge - note: items don't have edges, so we treat this case differently
			for(var s = 0; s < edges.length; s++){
				if(typeof edges[s] !== 'undefined' && typeof player_items[r] !== 'undefined'){
					if(isHiddenByShadow(edges[s], player_items[r], BLOCK_SIZE, q, 0)){
						delete player_items[r];
					}
				}
			}
		}
		
		player_items.clean(undefined);
	
		
		/*for(var r = 0; r < edges.length; r++){ //combine touching edges
			for(var s = 0; s < edges.length; s++){
				if(r != s){
					if(typeof edges[r] !== 'undefined' && typeof edges[s] !== 'undefined'){
						if(edges[r].vertex_a == edges[s].vertex_a){
							shadows.push(createShadow(createVertex(players[q].xPos, players[q].yPos), edges[r].vertex_b, edges[s].vertex_b));
							delete edges[r];
							delete edges[s];
						}else if(edges[r].vertex_b == edges[s].vertex_b){
							shadows.push(createShadow(createVertex(players[q].xPos, players[q].yPos), edges[r].vertex_a, edges[s].vertex_a));
							delete edges[r];
							delete edges[s];
						}else if(edges[r].vertex_a == edges[s].vertex_b){
							shadows.push(createShadow(createVertex(players[q].xPos, players[q].yPos), edges[r].vertex_b, edges[s].vertex_a));
							delete edges[r];
							delete edges[s];
						}else if(edges[r].vertex_b == edges[s].vertex_a){
							shadows.push(createShadow(createVertex(players[q].xPos, players[q].yPos), edges[r].vertex_a, edges[s].vertex_b));
							delete edges[r];
							delete edges[s];
						}
					}
				}
			}
		}
		
		edges.clean(undefined);*/
		
		for(var r = 0; r < edges.length; r++){
			shadows.push(createShadow(createVertex(players[q].xPos+20, players[q].yPos+20), edges[r].vertex_a, edges[r].vertex_b));
		}
		
				
		player_knowledge.stage = stage;
		player_knowledge.players = player_players;
		player_knowledge.countdown = countdown;
		player_knowledge.obstacles = player_obstacles;
		player_knowledge.map_radius = map_radius;
		player_knowledge.map_center_x = MAP_CENTER_X;
		player_knowledge.map_center_y = MAP_CENTER_Y;
		player_knowledge.items = player_items;
		player_knowledge.creatures = player_creatures;
		player_knowledge.draw_length = MAX_VISION_RADIUS;
		player_knowledge.shadows = shadows;
		
		return player_knowledge;
	
}

function sendAllGameData(){
	for(var i = 0; i < players.length; i++){
		if(typeof players[i] !== 'undefined'){
			io.sockets.connected[players[i].socket_id].emit('all_game_data', packageAllGameData(i));
		}
	}
	var data = {};
	data.stage = stage;
	data.countdown = countdown;
	data.map_radius = map_radius;
	io.emit('basic_data', data);
}

app.set('port', PORT_NUMBER);
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	var current_socket_id = socket.id;
	console.log("connected: " + current_socket_id);
	
	socket.on('disconnect', function(){
		console.log("disconnected: " + current_socket_id);
		delete players[getPlayerById(current_socket_id)];
	});
	
	if(stage == "STATS"){
		socket.on('register_form', function(data){
			console.log(data[3]);
			addNewPlayer(current_socket_id, data[3], data[0], data[1], data[2]);
		});
	}
	
	socket.on('user_input_state', function(data){
		if(stage == "GAMEPLAY"){
			if(typeof players[getPlayerById(current_socket_id)] !== 'undefined'){
				players[getPlayerById(current_socket_id)].mouseX = data[0];
				players[getPlayerById(current_socket_id)].mouseY = data[1];
				players[getPlayerById(current_socket_id)].isMouseDown = data[2];
				players[getPlayerById(current_socket_id)].isRightDown = data[3];
				players[getPlayerById(current_socket_id)].isLeftDown = data[4];
				players[getPlayerById(current_socket_id)].isUpDown = data[5];
				players[getPlayerById(current_socket_id)].isDownDown = data[6];
				players[getPlayerById(current_socket_id)].isShiftDown = data[7];
				players[getPlayerById(current_socket_id)].isSpaceDown = data[8];
				players[getPlayerById(current_socket_id)].isEDown = data[9];
				players[getPlayerById(current_socket_id)].isEnterDown = data[10];
				players[getPlayerById(current_socket_id)].isOneDown = data[11];
				players[getPlayerById(current_socket_id)].isTwoDown = data[12];
				players[getPlayerById(current_socket_id)].isThreeDown = data[13];
				players[getPlayerById(current_socket_id)].isFourDown = data[14];
				players[getPlayerById(current_socket_id)].isFiveDown = data[15];			
			}
		}
	});
	
	socket.on('window_size_data', function(data){
		if(stage == "GAMEPLAY"){
			if(typeof players[getPlayerById(current_socket_id)] !== 'undefined'){
				players[getPlayerById(current_socket_id)].windowWidth = data[0];
				players[getPlayerById(current_socket_id)].windowHeight = data[1];
			}
		}
	});
	
	io.sockets.connected[current_socket_id].emit('your_socket_id', current_socket_id);
	
});



lobby_trigger = setInterval(function(){handleLobby();}, 1000);
game_trigger = setInterval(function(){solvePhysics();  if(stage != "END"){ sendAllGameData();}  }, 1000/FRAME_RATE);


http.listen(PORT_NUMBER, function(){console.log('listening on *:' + PORT_NUMBER);});
