function createEdge(vertex_a, vertex_b, player, parent_object){
	var edge = {};
	edge.vertex_a = vertex_a;
	edge.vertex_b = vertex_b;
	edge.midpoint = {xPos: (vertex_a[0]+vertex_b[0])/2, yPos: (vertex_a[0] + vertex_b[1])/2};
	edge.slope = (vertex_a.yPos - vertex_b.yPos)/(vertex_a.xPos - vertex_b.xPos);
	edge.b = (-edge.slope*vertex_a.xPos) + vertex_a.yPos;
	edge.distance = (player.yPos - edge.slope * player.xPos - edge.b)/Math.sqrt(1+edge.slope*edge.slope);
	edge.parent_object = parent_object;
	return edge;
}
function createVertex(point_a, point_b){
	var vertex = {};
	vertex.xPos = point_a;
	vertex.yPos = point_b;
	return vertex;
}

var vertices = [];
				var edges = [];
				var rays = [];
				
				for(var r = 0; r < obstacles.length; r++){
					if(distFrom(obstacles[r].xPos, obstacles[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
						player_obstacles.push(obstacles[r]);
						var vertex1 = createVertex([obstacles[r].xPos, obstacles[r].yPos]);
						vertices.push(vertex1);
						var vertex2 = createVertex([obstacles[r].xPos + BLOCK_SIZE, obstacles[r].yPos]);
						vertices.push(vertex2);
						var vertex3 = createVertex([obstacles[r].xPos+BLOCK_SIZE, obstacles[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex3);
						var vertex4 = createVertex([obstacles[r].xPos, obstacles[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex4);
						

						var edge1 = createEdge(vertex1, vertex2, players[q], obstacles[r]);
						edges.push(edge1);
						var edge2 = createEdge(vertex2, vertex3, players[q], obstacles[r]);
						edges.push(edge2);
						var edge3 = createEdge(vertex3, vertex4, players[q], obstacles[r]);
						edges.push(edge3);
						var edge4 = createEdge(vertex4, vertex1, players[q], obstacles[r]);
						edges.push(edge4);

					}
				}
				
				for(var r = 0; r < players.length; r++){
					if(distFrom(players[r].xPos, players[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
						player_players.push(players[r]);
						var vertex1 = createVertex([players[r].xPos, players[r].yPos]);
						vertices.push(vertex1);
						var vertex2 = createVertex([players[r].xPos + BLOCK_SIZE, players[r].yPos]);
						vertices.push(vertex2);
						var vertex3 = createVertex([players[r].xPos+BLOCK_SIZE, players[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex3);
						var vertex4 = createVertex([players[r].xPos, players[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex4);
						

						var edge1 = createEdge(vertex1, vertex2, players[q], players[r]);
						edges.push(edge1);
						var edge2 = createEdge(vertex2, vertex3, players[q], players[r]);
						edges.push(edge2);
						var edge3 = createEdge(vertex3, vertex4, players[q], players[r]);
						edges.push(edge3);
						var edge4 = createEdge(vertex4, vertex1, players[q], players[r]);
						edges.push(edge4);
					}
				}
				
				for(var r = 0; r < items.length; r++){
					if(distFrom(items[r].xPos, items[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
						player_items.push(items[r]);
						var vertex1 = createVertex([items[r].xPos, items[r].yPos]);
						vertices.push(vertex1);
						var vertex2 = createVertex([items[r].xPos + BLOCK_SIZE, items[r].yPos]);
						vertices.push(vertex2);
						var vertex3 = createVertex([items[r].xPos+BLOCK_SIZE, items[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex3);
						var vertex4 = createVertex([items[r].xPos, items[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex4);
						

						var edge1 = createEdge(vertex1, vertex2, players[q], items[r]);
						edges.push(edge1);
						var edge2 = createEdge(vertex2, vertex3, players[q], items[r]);
						edges.push(edge2);
						var edge3 = createEdge(vertex3, vertex4, players[q], items[r]);
						edges.push(edge3);
						var edge4 = createEdge(vertex4, vertex1, players[q], items[r]);
						edges.push(edge4);
					}
				}
				
				for(var r = 0; r < creatures.length; r++){
					if(distFrom(creatures[r].xPos, creatures[r].yPos, players[q].xPos, players[q].yPos) < MAX_VISION_RADIUS){
						player_creatures.push(creatures[r]);
						var vertex1 = createVertex([creatures[r].xPos, creatures[r].yPos]);
						vertices.push(vertex1);
						var vertex2 = createVertex([creatures[r].xPos + BLOCK_SIZE, creatures[r].yPos]);
						vertices.push(vertex2);
						var vertex3 = createVertex([creatures[r].xPos+BLOCK_SIZE, creatures[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex3);
						var vertex4 = createVertex([creatures[r].xPos, creatures[r].yPos+BLOCK_SIZE]);
						vertices.push(vertex4);
						

						var edge1 = createEdge(vertex1, vertex2, players[q], creatures[r]);
						edges.push(edge1);
						var edge2 = createEdge(vertex2, vertex3, players[q], creatures[r]);
						edges.push(edge2);
						var edge3 = createEdge(vertex3, vertex4, players[q], creatures[r]);
						edges.push(edge3);
						var edge4 = createEdge(vertex4, vertex1, players[q], creatures[r]);
						edges.push(edge4);
					}
				}
				
				//add in stuff that removes everything in shadows
				edges.sort(function(a, b){
 					return a.distance-b.distance;
				});
				var edges_slopes = [];
				var edges_b_values = [];
				var edges_shapes = [];
				for (var r = 0; r < edges.length; r++){
					for (var n = 0; n < edges_slope.length; n++){
						var int_x = 
					}
									
					var edge_slope = ((edges[r].midpoint.yPos-players[q].yPos)/(edges[r].xPos-players[q].xPos));
					edges_slopes.push(edge_slope);
					var edge_b = -edge_slope*players[q].xPos + players[q].yPos;
					edges_b_values.push(edge_b);
					edges_shapes.push(edge.parent_object);

				}
				for(var r = 0; r < vertices.length; r++){
					var distances = [];
					var vertices_slope = (players[q].yPos - vertices[r].yPos) / (players[q].xPos - vertices[r].xPos);
					var vertices_b = (-vertices_slope * players[q].xPos) + players[q].yPos;
					var above = (vertices[r].yPos >= players[q].yPos) ? true : false;
					for (var f = 0; f < edges.length; f++){
						
					}
				}
