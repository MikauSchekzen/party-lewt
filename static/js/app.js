var socket = io();
var games;
var categories = {
weapons: {
		name: "Weapons"
	},
	armor: {
		name: "Armor"
	},
	wondrous: {
		name: "Wondrous Items"
	},
	potions: {
		name: "Potions"
	},
	scrolls: {
		name: "Scrolls"
	},
	wands_rods: {
		name: "Wands and Rods"
	},
	alchemical: {
		name: "Alchemical"
	},
	reagents: {
		name: "Reagents"
	},
	trash: {
		name: "Trash"
	},
	key: {
		name: "Key Items"
	}
};
var selection = {
	game: null,
	unit: null,
	item: null
};

socket.on("data-full", function(data) {
	games = data;
	applyData();
});

socket.on("edit-item", function(game, unit, itemIndex, item) {
	var items, newItem, selectedIndex;
	if(games[game] && games[game].units[unit]) {
		items = games[game].units[unit].items;
		selectedIndex = items.indexOf(selection.item);
		newItem = items.splice(itemIndex, 1, item);
		if(selection.unit === games[game].units[unit]) {
			var oldSelectionIndex = document.getElementById("items").selectedIndex;
			if(selectedIndex == itemIndex) {
				refreshItemList();
				clearItem();
			}
			else {
				refreshItemList();
				document.getElementById("items").selectedIndex = oldSelectionIndex;
			}
		}
	}
});

socket.on("new-item", function(game, unit, item) {
	var items;
	if(games[game] && games[game].units[unit]) {
		items = games[game].units[unit].items;
		items.push(item);
		if(selection.unit === games[game].units[unit]) {
			var oldItemIndex = document.getElementById("items").selectedIndex;
			var curCat;
			if(document.getElementById("categories").selectedIndex !== -1) {
				curCat = document.getElementById("categories").options[document.getElementById("categories").selectedIndex].value;
			}
			if(curCat == item.category) {
				var newElem = document.createElement("option");
				newElem.value = items.indexOf(item).toString();
				newElem.innerHTML = getItemName(item);
				document.getElementById("items").appendChild(newElem);
			}
		}
	}
});

socket.on("delete-item", function(game, unit, itemIndex) {
	var items, a;
	if(games[game] && games[game].units[unit]) {
		items = games[game].units[unit].items;
		var item = items.splice(itemIndex)[0];
		if(selection.unit === games[game].units[unit]) {
			var curCat;
			if(document.getElementById("categories").selectedIndex !== -1) {
				curCat = document.getElementById("categories").options[document.getElementById("categories").selectedIndex].value;
			}
			if(curCat == item.category) {
				refreshItemList();
				var oldIndex = selection.unit.items.indexOf(selection.item);
				if(oldIndex !== -1) {
					for(a = 0;a < document.getElementById("items").options.length;a++) {
						var option = document.getElementById("items").options[a];
						if(option.value == oldIndex.toString()) {
							document.getElementById("items").selectedIndex = a.toString();
						}
					}
				}
			}
		}
	}
});

var applyData = function() {
	// Clear everything
	var elems = ["games", "units", "categories", "items"], a;
	for(a = 0;a < elems.length;a++) {
		clearList(elems[a]);
	}
	selection.game = null;
	selection.unit = null;
	clearItem();

	// Populate games
	var a, game, elem;
	for(a in games) {
		game = games[a];
		elem = document.createElement("option");
		elem.value = a;
		elem.innerHTML = game.name;
		document.getElementById("games").appendChild(elem);
	}
};

var clearList = function(selectId) {
	var elem;
	elem = document.getElementById(selectId);
	if(elem) {
		while(elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}
	}
};

var clearItem = function() {
	document.getElementById("item_name").value = "";
	document.getElementById("item_amount").value = "";
	document.getElementById("item_value").value = "";
	// Fill categories
	var elem = document.getElementById("item_category");
	while(elem.firstChild) {
		elem.removeChild(elem.firstChild);
	}
	var a, cat;
	for(a in categories) {
		cat = categories[a];
		elem = document.createElement("option");
		elem.value = a;
		elem.innerHTML = cat.name;
		document.getElementById("item_category").appendChild(elem);
	}
};

var selectGame = function() {
	clearList("units");
	clearList("categories");
	clearList("items");
	clearItem();
	var elem = document.getElementById("games");
	var value = elem.options[elem.selectedIndex].value;
	var units = games[value].units;
	selection.game = games[value];
	var a, unit, newElem;
	for(a in units) {
		unit = units[a];
		newElem = document.createElement("option");
		newElem.value = a;
		newElem.innerHTML = unit.name;
		document.getElementById("units").appendChild(newElem);
	}
};

var selectUnit = function() {
	clearList("categories");
	clearList("items");
	clearItem();
	var elem = document.getElementById("units");
	var value = elem.options[elem.selectedIndex].value;
	selection.unit = selection.game.units[value];
	var a, cat, newElem;
	for(a in categories) {
		cat = categories[a];
		newElem = document.createElement("option");
		newElem.value = a;
		newElem.innerHTML = cat.name;
		document.getElementById("categories").appendChild(newElem);
	}
};

var selectCategory = function() {
	refreshItemList();
	clearItem();
};

var refreshItemList = function() {
	clearList("items");
	var elem = document.getElementById("categories");
	var value = elem.options[elem.selectedIndex].value;
	var a, item, newElem, items = selection.unit.items, endName;
	for(a = 0;a < items.length;a++) {
		item = items[a];
		if(item.category == value) {
			newElem = document.createElement("option");
			newElem.value = a;
			newElem.innerHTML = getItemName(item);
			document.getElementById("items").appendChild(newElem);
		}
	}
};

var getItemName = function(item) {
	var endName = item.name;
	if(item.amount > 1) {
		endName = endName + " (" + item.amount.toString() + ")";
	}
	return endName;
};

var selectItem = function() {
	clearItem();
	var elem = document.getElementById("items");
	var value = parseInt(elem.options[elem.selectedIndex].value);
	var item = selection.unit.items[value];
	selection.item = item;
	// Set values
	document.getElementById("item_name").value = item.name;
	document.getElementById("item_amount").value = item.amount.toString();
	document.getElementById("item_value").value = item.value.toString();
	// Set categories
	var catElem = document.getElementById("item_category");
	var a;
	for(a in catElem.options) {
		if(catElem.options[a].value == item.category) {
			catElem.selectedIndex = a;
		}
	}
};

var editItem = function(item) {
	// Edit item
	var curName = item.name;
	item.name = document.getElementById("item_name").value;
	var curAmount = item.amount;
	item.amount = parseInt(document.getElementById("item_amount").value);
	item.value = parseInt(document.getElementById("item_value").value);
	var curCat = item.category;
	item.category = document.getElementById("item_category").options[document.getElementById("item_category").selectedIndex].value;

	// Refresh stuff
	if(curCat != item.category || curAmount != item.amount || curName != item.name) {
		selectCategory();
	}
};

var applyItem = function() {
	// Determine item
	var elem = document.getElementById("items");
	var itemIndex = parseInt(elem.options[elem.selectedIndex].value);
	var item = selection.unit.items[itemIndex];
	// Alter current item to new values
	editItem(item);
	// Determine game key
	elem = document.getElementById("games");
	var game = elem.options[elem.selectedIndex].value;
	// Determine unit key
	elem = document.getElementById("units");
	var unit = elem.options[elem.selectedIndex].value;
	// Send results
	socket.emit("edit-item", game, unit, itemIndex, item);
};

var newItem = function() {
	var index = document.getElementById("categories").selectedIndex;
	if(index === -1) {
		return false;
	}
	else {
		var curCat = document.getElementById("categories").options[document.getElementById("categories").selectedIndex].value;
		var newItem = {
			name: "-New Item-",
			category: curCat,
			amount: 1,
			value: 0
		};
		selection.unit.items.push(newItem);
		clearItem();
		refreshItemList();
		// Determine game key
		elem = document.getElementById("games");
		var game = elem.options[elem.selectedIndex].value;
		// Determine unit key
		elem = document.getElementById("units");
		var unit = elem.options[elem.selectedIndex].value;
		socket.emit("new-item", game, unit, newItem);
	}
};

var deleteItem = function() {
	var index = document.getElementById("items").selectedIndex;
	if(index !== -1) {
		var items = selection.unit.items;
		var itemIndex = parseInt(document.getElementById("items").options[index].value);
		items.splice(itemIndex, 1);
		clearItem();
		refreshItemList();
		// Determine game key
		elem = document.getElementById("games");
		var game = elem.options[elem.selectedIndex].value;
		// Determine unit key
		elem = document.getElementById("units");
		var unit = elem.options[elem.selectedIndex].value;
		socket.emit("delete-item", game, unit, itemIndex);
	}
};
