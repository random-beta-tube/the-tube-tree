let modInfo = {
	name: "The tube Tree",
	author: "random-beta-tube",
	pointsName: "tubes",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal (8), // Used for hard resets and new players
	offlineLimit: 1,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "0.0.1",
	name: "Tubes & Fire",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.0.1</h3><br>
		- Made the game<br>
		- Added upgrades<br>
		- Added achievements<br>
		- Added the fire subtab.<br>
		- Added more stuff lol.<br>
		- Endgame: 1e43 tubes`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return true
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)
	if(getClickableState('fire',11)){
		let burn_time = player.fire.burn_time
		let loss = new Decimal(2).pow(new Decimal(2).pow(burn_time.add(1)).times(2))
		return loss.times(-1)
	}
	let gain = new Decimal(0)
	if (hasUpgrade('f', 11)) gain = gain.add(1);
	if (hasUpgrade('f', 12)){
		let generation = player["f"].points
		if (hasUpgrade('f', 14)){generation = generation.times(upgradeEffect('f', 14))}
		gain = gain.add(generation);
	}
	if (hasAchievement('ach', 12)) gain = gain.mul(1.02)

	if (hasUpgrade('fire', 11)) gain = gain.pow(1.1)
	if (hasUpgrade('fire', 13)) gain = gain.mul(upgradeEffect('fire', 13))
	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(new Decimal("1e43"))
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(100) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}