<?php

if($_POST["pass"] == ""){
	echo '<html><form action="index.php" method="POST">This page is for admins only! Please enter your password to pull from git and restart the server: <input type="password" name="pass"></input><input type="submit"></input></form></html>';	
}else if($_POST["pass"] == "nikhilsaysgolub"){
	//pull from git and update server
	//todo: add pull from git code
	shell_exec("killall -9 nodejs");
	shell_exec("nodejs index.js");
}else{
	echo 'incorrect password. sorry.';
}

?>