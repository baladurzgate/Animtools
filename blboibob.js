
OO.RigManager = function (_S) {

	var S = _S;

	// key of node custom feilds used for marking : no underscores ! 
	var CODE_KEY = "assetcode";
	var ID_KEY = "nodeid"
	var CURRENT_GROUP = "Top"
	this.last_x = 0
	this.last_y = 0
	this.current_repport = {}
	this.current_node = ""
	this.builder = new OO.RigNodeBuilder(_S)
	this.mc = new OO.MCManager()

	/*TODO

		each nodes should be marked with a rig version

		this.set_rig_version = function(){

		}

	*/

	this.reset_stack = function () {
		this.last_x = 0
		this.last_y = 0
	}

	this.change_transform_switch_elements_path = function (_ts_node_path) {
		S.log.add("[RigManager] changing transform switch element path", "process")
		var current_timing = node.getTextAttr(_ts_node_path, frame.current(), "Drawing.CUSTOM_NAME.TIMING");
		MessageLog.trace(node.linkedColumn(_ts_node_path, "Drawing.CUSTOM_NAME.TIMING"))
		var sNode = "Top/Deformation-Drawing/Transformation-Switch";
		var wAttr = node.getAttr(sNode, 1, "drawing.timing");
		var myAttributeValue = wAttr.textValue();
	}

	this.hide_all_mcs = function () {
		var mc_list = node.getNodes(["MasterController"]);
		print(mc_list)
		for (var n = 0; n < mc_list.length; n++) {
			var mc = mc_list[n]
			node.setEnable(mc, false)
		}
	}
	this.show_all_mcs = function () {
		var mc_list = node.getNodes(["MasterController"]);
		print(mc_list)
		for (var n = 0; n < mc_list.length; n++) {
			var mc = mc_list[n]
			node.setEnable(mc, true)
		}
	}


	// NODES METADATAS 

	this.mark_node = function (_node_path, _code) {

		if (typeof (_node_path) == 'object') {
			//this is probaly a openHarmony node object 
			_node_path = _node_path.path
		}

		var node_type = node.type(_node_path)
		var serial = node_type + "_" + get_unique_id();
		MessageLog.trace(_node_path)
		add_or_set_new_text_attribute(_node_path, "assetcode", _code);
		add_or_set_new_text_attribute(_node_path, "nodeid", serial);
	}

	function add_or_set_new_text_attribute(_nodeName, _attrName, _value) {
		var attr = node.getAttr(_nodeName, frame.current(), _attrName);
		if (attr.keyword() == "") {
			node.createDynamicAttr(_nodeName, "STRING", _attrName, _attrName, false)
			MessageLog.trace("SET " + _nodeName + "    " + _attrName + " = " + _value)
		}
		node.setTextAttr(_nodeName, _attrName, frame.current(), _value);
	}

	this.get_asset_code_of_node = function (_node_path) {

		/*
		T: 10:04:11.368 assetcode = ch_billy
		T: 10:04:11.368 nodeid = READ_3064148
		*/

		if (typeof (_node_path) == 'object') {
			//this is probaly a openHarmony node object 
			_node_path = _node_path.path
		}

		var code = node.getTextAttr(_node_path, frame.current(), CODE_KEY);
		if (code != "") {
			return code
		} else {
			return false
		}
	}

	this.get_id_of_node = function (_node_path) {

		if (typeof (_node_path) == 'object') {
			//this is probaly a openHarmony node object 
			_node_path = _node_path.path
		}

		var code = node.getTextAttr(_node_path, frame.current(), ID_KEY);
		if (code != "") {
			return code
		} else {
			return false
		}

	}

	this.set_current_group = function (_gp) {
		CURRENT_GROUP = _gp
	}

	this.put_next_to = function (_node_A, _node_B, _gab_x) {
		var new_y = node.coordY(_node_B)
		var new_x = node.coordX(_node_B) + _gab_x
		node.setCoord(_node_A, new_x, new_y)
	}

	this.add_node_over = function (_type, _name, _near_node_path, _stack) {

		var near_node_path = _near_node_path != undefined ? _near_node_path : false
		var stack = _stack != undefined ? _stack : false
		if (near_node_path == false) {
			return
		}
		var coords = [0, 0, 0]
		var gapy = 50
		var gapx = 20
		var parent_group = node.parentNode(near_node_path)
		var new_y = node.coordY(near_node_path) - gapy
		var new_x = node.coordX(near_node_path) - gapx
		if (stack == true) {
			if (this.last_y == 0) {
				this.last_y = node.coordY(near_node_path)
			}
			new_y = this.last_y + gapy
			this.last_y = new_y
		}
		coords = [new_x, new_y, 0];
		node.add(parent_group, _name, _type, coords[0], coords[1], coords[2])
		return parent_group + "/" + _name

	}

	this.add_node_bellow = function (_type, _name, _near_node_path, _stack) {

		var near_node_path = _near_node_path != undefined ? _near_node_path : false
		var stack = _stack != undefined ? _stack : false
		if (near_node_path == false) {
			return
		}
		var coords = [0, 0, 0]
		var gapy = 50
		var parent_group = node.parentNode(near_node_path)
		var new_y = node.coordY(near_node_path) + gapy
		if (stack == true) {
			if (this.last_y === undefined || this.last_y === 0) {
				this.last_y = node.coordY(near_node_path);
			}
			new_y = this.last_y + gapy
			this.last_y = new_y
		}
		coords = [node.coordX(near_node_path), new_y, 0];
		

		node.add(parent_group, _name, _type, coords[0], coords[1], coords[2])
		return parent_group + "/" + _name

	}

	this.connect_out = function (_source_node, _target_node, _in, _out) {
		var inport = _in != undefined ? _in : 0
		var outport = _out != undefined ? _out : 0
		node.link(_source_node, inport, _target_node, outport, false, true);
		var numInput = node.numberOfInputPorts(_target_node);
		return numInput - 1;
	}

	this.connect_out_matte = function (_source_node, _target_node, _in, _out) {
		var outport = this._get_last_out_port(_source_node) // we cannot check if the outport is a matte unfortunately
		var inport = this._get_first_matte_in_port(_target_node) //  we can only check the input port
		if (inport == "no_port" || outport == "no_port") {
			//connect something 
			outport = this._get_first_in_port(_target_node)
			inport = 0
		}
		MessageLog.trace("[RigManager] Connecting " + _source_node + " OUT(" + outport + ") to " + _target_node + " IN(" + inport + ")")
		node.link(_source_node, inport, _target_node, outport, false, true);
		var numInput = node.numberOfInputPorts(_target_node);
		return numInput - 1;
	}

	this.connect_out_matte_first_port = function (_source_node, _target_node, _in, _out) {
		var inport = this._get_first_matte_out_port(_source_node)
		var outport = this._get_first_matte_out_port(_source_node)
		node.link(_source_node, inport, _target_node, outport, false, true);
		var numInput = node.numberOfInputPorts(_target_node);
		return numInput - 1;
	}

	this._get_last_out_port = function (_node) {
		return 0
	}
	this._get_last_in_port = function (_node) {
		if (node.numberOfInputPorts(_node) == 0) {
			return 0
		}
		return node.numberOfInputPorts(_node) - 1
	}
	this._get_first_in_port = function (_node) {
		if (node.numberOfInputPorts(_node) == 0) {
			return 0
		}
		return node.numberOfInputPorts(_node) - 1
	}

	this._get_first_matte_out_port = function (_node) {
		// the port to the most left of the source_node
		var nbports = node.numberOfOutputPorts(_node);
		for (var n = 0; n < nbports; n++) {
			MessageLog.trace("port " + n)
			if (node.srcPortIsMattePort(_node, n) == false) {
				continue
			} else {
				MessageLog.trace("port " + n)
				MessageLog.trace("[RigManager] found matte port " + n + " for (" + _node + ")")
				return n
			}
		}
		MessageLog.trace("[RigManager][get_first_matte_out_port] WARNING found no matte out port for (" + _node + ")")
		return 0
	}
	this._get_first_matte_in_port = function (_node) {
		// the port to the most left of the source_node
		var nbports = node.numberOfInputPorts(_node);
		for (var n = 0; n < nbports; n++) {
			MessageLog.trace("port " + n)
			if (node.srcPortIsMattePort(_node, n) == false) {
				continue
			} else {
				MessageLog.trace("port " + n)
				MessageLog.trace("[RigManager]  found matte in port " + n + " for (" + _node + ")")
				return n
			}
		}
		MessageLog.trace("[RigManager][get_first_matte_out_port] WARNING found no matte in port for (" + _node + ")")
		return 0
	}

	this._get_last_matte_out_port = function (_node) {
		// the port to the most rigth of the source_node
		var ports = node.numberOfOutputPorts(_node);
		for (var n = 0; n < ports.length; n++) {
			if (node.srcPortIsMattePort(_node, n)) {
				MessageLog.trace("[RigManager] found matte port " + n + " for (" + _node + ")")
				return n
			}
		}
		MessageLog.trace("[RigManager][get_last_matte_out_port] WARNING found no matte out port for (" + _node + ") " + n)
		return 0
	}

	this.disconnect_out = function (_node, _target_node) {
		/*
			disconnect "_target_node" from "_node"
		*/
		var target_node = _target_node != undefined ? _target_node : "all"
		var out_nodes = this.get_linked_out_nodes(_node)
		for (var n = 0; n < out_nodes.length; n++) {
			var curr = out_nodes[n]
			var inport = this.get_inport_of_connected_node(curr, _node)
			if (target_node == "all") {
				node.unlink(curr, inport)
				continue
			}
			if (curr == target_node) {
				print("unlink")
				print(inport)
				node.unlink(curr, inport)
				break
			}
		}
	}

	this.get_group = function (_node) {
		return node.parentNode(_node)
	}

	this.get_nodes_of_part = function (_group, _part_name) {
		var group_name = _group
		if (_group.indexOf("Top/") != -1) {
			group_name = _group.split("Top/")[1]
		}
		var group_guess = this.tolerant_group_search("Top/" + group_name);
		var part_nodes = []
		if (group_guess != false) {
			var peg_guess = this.tolerant_peg_search(group_guess, _part_name)
			if (peg_guess == false) {
				var upper_guess = _part_name.toUpperCase()
				if (upper_guess == "NECK") {
					peg_guess = this.find_neck_peg(group_guess)
				}
				if (upper_guess == "COU") {
					peg_guess = this.find_neck_peg(group_guess)
				}
				if (upper_guess == "HEAD") {
					peg_guess = this.find_head_peg(group_guess)
				}
				if (upper_guess == "FACE") {
					peg_guess = this.find_face_peg(group_guess)
				}
			}
			if (peg_guess != false) {
				part_nodes = this.get_all_child_nodes(peg_guess)
			}
		}
		return part_nodes
	}

	this.get_linked_out_nodes = function (_node) {
		var numOutput = node.numberOfOutputPorts(_node);
		var listOfDestinationNodes = [];
		for (var i = 0; i < numOutput; i++) {
			nbLinks = node.numberOfOutputLinks(_node, i)
			for (var j = 0; j < nbLinks; j++) {
				listOfDestinationNodes.push(node.dstNode(_node, i, j));
			}
		}
		return listOfDestinationNodes;
	}

	this.get_linked_out_nodes_table = function (_node) {
		var nodes = {}
		var numOutput = node.numberOfOutputPorts(_node);
		for (var i = 0; i < numOutput; i++) {
			nbLinks = node.numberOfOutputLinks(_node, i)
			if (nodes[i] == undefined) {
				nodes[i] = []
			}
			for (var j = 0; j < nbLinks; j++) {
				var dst_node = node.dstNode(_node, i, j)
				if (node.type(dst_node) == "Multi-Port-Out") {

				}
				nodes[i].push(dst_node);
			}
		}
		return nodes;
	}

	this.get_linked_in_nodes = function (_source) {
		var nodes = []
		for (var i = node.numberOfInputPorts(_source); i > 0; i--) {
			var connected_node = node.srcNode(_source, i)
			nodes.push(connected_node)
		}
		return nodes
	}

	this.get_linked_in_nodes_table = function (_source) {
		var nodes = {}
		for (var i = 0; i < node.numberOfInputPorts(_source); i++) {
			var connected_node = node.srcNode(_source, i)
			nodes[i] = connected_node
		}
		return nodes
	}

	this.get_inport_of_connected_node = function (_source, _node) {
		for (var i = 0; i < node.numberOfInputPorts(_source); i++) {
			var connected_node = node.srcNode(_source, i)
			print(i)
			print(connected_node)
			if (connected_node == _node) {
				return i
			}
		}
		return false
	}
	function _generate_asset_code_variations(asset_code) {
		var split_u = asset_code.split("_")
		var parts = []
		var variations = []
		var reverse = []
		for (var s = 0; s < split_u.length; s++) {
			parts.push(split_u[s])
			variations.push(parts.join("_"))
		}
		for (var v = variations.length - 1; v >= 0; v--) {
			reverse.push(variations[v])
		}
		return reverse

	}


	this.tolerant_code_group_search = function (_group_name) {
		S.log.add("[RigManager] tolerant_code_group_search", "rig")
		var variations = _generate_asset_code_variations(_group_name)
		for (var s = 0; s < variations.length; s++) {
			var search = this.tolerant_group_search(variations[s])
			if (search == false) {
				continue
			}
			return search
		}
		return false
	}

	this.tolerant_group_search = function (_group_name) {
		var guess = [_group_name, _group_name + "-G", _group_name + "_G", _group_name + "_1", _group_name + "_2", _group_name + "_3", _group_name.toUpperCase()]
		var split_slash = _group_name.split("/")
		var group_bare = split_slash[split_slash.length - 1]
		//search per variations
		S.log.add("[RigManager] searching group " + _group_name, "rig")
		S.log.add("[RigManager] search per variations", "rig")
		for (var g in guess) {
			S.log.add("[RigManager] try " + guess[g], "rig")
			if (node.isGroup(guess[g]) == true) {
				S.log.add("[RigManager] found " + guess[g], "rig")
				return guess[g]
			}
		}
		//search per name pattern
		var all_groups = this.get_all_interesting_groups()
		var min_length = 100000000
		var shortest_group = ""
		S.log.add("[RigManager] search per name pattern", "rig")
		var guess = [_group_name, group_bare.toUpperCase(), group_bare.toLowerCase()]
		for (var gr in all_groups) {
			for (var g in guess) {
				if (all_groups[gr].indexOf(guess[g]) != -1) {
					if (all_groups[gr].length < min_length) {
						min_length = all_groups[gr].length
						shortest_group = all_groups[gr]
					}
				}
			}
		}
		if (shortest_group != "") {
			S.log.add("[RigManager] found shortest match " + shortest_group, "rig")
			return shortest_group
		}
		S.log.add("[RigManager] can't found any group matching " + _group_name, "rig")
		return false
	}

	this.get_shortest_group_path = function () {
		var int_groups = this.get_all_interesting_groups()
		var shortest = "---------------------------------------"
		for (var g in int_groups) {
			if (int_groups[g].length < shortest.length) {
				shortest = int_groups[g]
			}
		}
		return shortest
	}

	this.get_all_interesting_groups = function () {
		var all_reads = node.getNodes(["MULTIPORT_OUT", "MULTIPORT_IN"])
		var groups = []
		for (var r in all_reads) {
			var split_slash = all_reads[r].split("/")
			if (split_slash.length > 1) {
				var last = split_slash[split_slash.length - 1]
				var group_path = all_reads[r].split("/" + last)[0]
				if (groups.indexOf(group_path) == -1) {
					groups.push(group_path)
				}
			}
		}
		return groups
	}

	this.get_sub_groups = function (_group) {
		var sub_groups = []
		if (node.isGroup(_group)) {
			var groups_to_analyse = [_group]
			for (var g = 0; g < groups_to_analyse.length; g++) {
				for (var i = 0; i < node.numberOfSubNodes(groups_to_analyse[g]); i++) {
					var current_node = node.subNode(groups_to_analyse[g], i)
					if (node.isGroup(current_node)) {
						groups_to_analyse.push(current_node)
						sub_groups.push(current_node)
					}
				}
			}
		}
		return sub_groups
	}

	this.tolerant_composite_search = function (_parent_group, _name) {
		var name_guess = [_name, _name + "-C", _name + "_C", "Composite_" + _name, _name.toUpperCase(), _name.toUpperCase() + "_C", _name.toUpperCase() + "-C", _name.toLowerCase(), _name.toLowerCase() + "_C", _name.toLowerCase() + "-C"]
		var path_guess = []
		var possible_groups = this.get_sub_groups(_parent_group)
		possible_groups.unshift(_parent_group)
		for (var pg in possible_groups) {
			for (var g in name_guess) {
				var group_guess_name = possible_groups[pg] + "/" + name_guess[g]
				path_guess.push(group_guess_name)
			}
		}
		for (var p in path_guess) {
			var path = path_guess[p]
			if (node.type(path) == "COMPOSITE") {
				S.log.add("[RigManager] found composite " + path)
				return path
			}
		}
		return false
	}

	this.tolerant_peg_search = function (_parent_group, _name) {
		var name_guess = [_name, _name + "-P", _name + "-Peg", _name + "_Peg", _name + "_P", _name.toUpperCase(), _name.toUpperCase() + "_P", _name.toUpperCase() + "-P", _name.toLowerCase(), _name.toLowerCase() + "_P", _name.toLowerCase() + "-P"]
		var path_guess = []
		var possible_groups = this.get_sub_groups(_parent_group)
		possible_groups.unshift(_parent_group)
		for (var pg in possible_groups) {
			for (var g in name_guess) {
				var group_guess_name = possible_groups[pg] + "/" + name_guess[g]
				path_guess.push(group_guess_name)
			}
		}
		for (var p in path_guess) {
			var path = path_guess[p]
			if (node.type(path) == "PEG") {
				S.log.add("[RigManager] found peg " + path)
				return path
			}
		}
		return false
	}

	this.first_existing_node = function (_list) {
		for (var i = 0; i < _list.length; i++) {
			if (this.node_exists(_list[i]) == false) {
				continue
			}
			return _list[i]
		}
	}

	this.tolerant_node_search = function (_node_path, _node_type) {
		var path_guess = [_node_path]
		var type = _node_type != undefined ? _node_type : "all"
		var found_nodes = []
		if (this.node_exists(_node_path)) {
			return [_node_path]
		}
		for (var i = 0; i < 5; i++) {
			var number = i + ""
			var node_copy = _node_path + "_" + number
			path_guess.push(node_copy)
			path_guess.push(node_copy.toUpperCase())
			path_guess.push(node_copy.toLowerCase())
		}
		for (var j = 0; j < path_guess.length; j++) {
			if (this.node_exists(path_guess[j]) == false) {
				continue
			}
			if (type != "all" && node.type(path_guess[j]) != type) {
				continue
			}

			found_nodes.push(path_guess[j])
		}
		return found_nodes
	}

	this.find_head_peg = function (_parent_group) {
		var guess = ["HEAD_BANK", "HEAD-BANK", "HEAD", "TETE", "Head", "Tete"]
		S.log.add("[RigManager] searching head peg", "rig")
		for (var g in guess) {
			var path = this.tolerant_peg_search(_parent_group, guess[g])
			if (path != false) {
				S.log.add("[RigManager] found " + path, "rig")
				return path
			}
		}
		return false
	}

	this.find_head_composite = function (_parent_group) {
		var guess = ["Composite_NECK", "TETE_COMPLETE", "TETE", "JC_TETE", "TETE_BILLY", "Head", "Tete", "HEAD", "VISAGE", "CPST_HEAD_POSING", "CPST_DISPLAY_HEAD"]
		S.log.add("[RigManager] searching head composite", "rig")
		for (var g in guess) {
			var path = this.tolerant_composite_search(_parent_group, guess[g])
			if (path != false) {
				S.log.add("[RigManager] found " + path, "rig")
				return path
			}
		}
		return false
	}

	this.find_neck_peg = function (_parent_group) {
		var guess = ["NECK", "COU", "TETE_COU", "COU_TETE", "Neck", "Cou"]
		S.log.add("[RigManager] searching neck peg", "rig")
		for (var g in guess) {
			var path = this.tolerant_peg_search(_parent_group, guess[g])
			if (path != false) {
				S.log.add("[RigManager] found " + path, "rig")
				return path
			}
		}
		return false
	}

	this.find_face_peg = function (_parent_group) {
		var guess = ["face", "face-p", "FACE", "FACE-P", "FACE_P", "VISAGE", "VISAGE-P", "VISAGE_P"]
		S.log.add("[RigManager] searching face peg")
		for (var g in guess) {
			var path = this.tolerant_peg_search(_parent_group, guess[g])
			if (path != false) {
				S.log.add("[RigManager] found " + path, "rig")
				return path
			}
		}
		return false
	}

	this.get_all_child_nodes = function (_node) {
		var child_nodes = []
		function get_child_nodes(_node) {
			var sub_nodes = get_out_nodes(_node)
			//var sibbling_nodes = get_in_nodes(_node)
			for (var n in sub_nodes) {
				if (child_nodes.indexOf(sub_nodes[n]) != -1) {
					continue
				}
				if (node.type(sub_nodes[n]) == "MULTIPORT_OUT") {
					continue
				}
				if (node.type(sub_nodes[n]) == "MULTIPORT_IN") {
					continue
				}
				child_nodes.push(sub_nodes[n])
				var outs = node.numberOfOutputPorts(sub_nodes[n]);
				var ins = node.numberOfInputPorts(sub_nodes[n]);
				if (outs > 0 || ins > 0) {
					get_child_nodes(sub_nodes[n])
				}

			}
		}
		function get_in_nodes(_node) {
			var numInput = node.numberOfInputPorts(_node);
			var list = [];
			for (var i = 0; i < numInput; i++) {
				var current_node = node.srcNode(_node, i)
				if (child_nodes.indexOf(current_node) != -1) {
					continue
				}
				list.push(current_node);
			}
			return list;
		}
		function get_out_nodes(_node) {
			var numOutput = node.numberOfOutputPorts(_node);
			var list = [];
			for (var i = 0; i < numOutput; i++) {
				var nblinks = node.numberOfOutputLinks(_node, i)
				for (var j = 0; j < nblinks; j++) {
					var current_node = node.dstNode(_node, i, j)
					if (child_nodes.indexOf(current_node) != -1) {
						continue
					}
					list.push(current_node);
				}
			}
			return list;
		}
		child_nodes.push(_node)
		get_child_nodes(_node)
		return child_nodes
	}

	this.get_out_nodes = function (_node) {
		var numOutput = node.numberOfOutputPorts(_node);
		var listOfDestinationNodes = [];
		for (var i = 0; i < numOutput; i++) {
			listOfDestinationNodes.push(node.dstNode(_node, i, 0));
		}
		return listOfDestinationNodes;
	}

	this.is_texture_node = function (_node_path) {
		var split_slash = _node_path.split("/")
		var node_name = split_slash[split_slash.length - 1]
		var texture_key_words = ["TEXTURE_"]
		for (var k in texture_key_words) {
			if (node_name.indexOf(texture_key_words[k]) != -1) {
				return true
			}
		}
		return false
	}

	this.activate_textures = function () {
		var reads = node.getNodes(["READ"])
		for (var r in reads) {
			var current_read = reads[r]
			if (this.is_texture_node(current_read)) {
				this.activate_node(current_read)
			}
		}
	}

	this.deactivate_node = function (_node_path) {
		node.setEnable(_node_path, false)
	}

	this.activate_node = function (_node_path) {
		node.setEnable(_node_path, true)
	}

	this.toggle_node = function (_node_path) {
		var state = node.getEnable(_node_path)
		node.setEnable(_node_path, !state)
	}

	this.node_exists = function (_node_path) {
		if (node.type(_node_path) == "") {
			return false
		}
		return true
	}

	this.find_scene_composite = function () {
		S.log.add("[RigManager] searching for scene composite")
		//convention names 
		var possible_names = ["CHECKC", "CHECK-C", "FINAL-C", "CPST_SCENE", "ANIM-C", "Composite", "composite"]
		for (var i in possible_names) {
			var path = "Top/" + possible_names[i]
			if (node.type(path) == "COMPOSITE") {
				return path
			}
		}
		S.log.add("[RigManager] No conventionnal composite found in scene")
		//first composite found in top 
		var all_composites = node.getNodes(["COMPOSITE"])
		if (all_composites.length == 0) {
			S.log.add("[RigManager] No composite found in scene ")
			return false
		}
		for (var c in all_composites) {
			if (all_composites[c].indexOf("Top/") != -1) {
				return all_composites[c]
			}
		}
		return false
	}
	this.find_anim_composite = function () {
		S.log.add("[RigManager] searching for scene composite")
		//convention names 
		var possible_names = ["ANIM-C", "ANIM+BG-C", "CHECKC", "CHECK-C", "FINAL-C"]
		for (var i in possible_names) {
			var path = "Top/" + possible_names[i]
			if (node.type(path) == "COMPOSITE") {
				return path
			}
		}
		S.log.add("[RigManager] No conventionnal composite found in scene")
		//first composite found in top 
		var all_composites = node.getNodes(["COMPOSITE"])
		if (all_composites.length == 0) {
			S.log.add("[RigManager] No composite found in scene ")
			return false
		}
		for (var c in all_composites) {
			if (all_composites[c].indexOf("Top/") != -1) {
				return all_composites[c]
			}
		}
		return false
	}

	this.connect_to_scene_composite = function (_node_path) {
		var scene_composite = this.find_scene_composite()
		if (scene_composite != false) {
			this.connect_out_matte(_node_path, scene_composite)
		}
	}
	this.connect_to_anim_composite = function (_node_path) {
		var scene_composite = this.find_anim_composite()
		if (scene_composite != false) {
			this.connect_out_matte(_node_path, scene_composite)
		}
	}

	this.set_in_line = function (_node_path) {
		if (this.last_x == 0 && this.last_y == 0) {
			this.last_x = node.coordX(_node_path)
			this.last_y = node.coordY(_node_path)
			return
		}
		var gap = 200
		node.setCoord(_node_path, this.last_x + gap, this.last_y)
		this.last_x = node.coordX(_node_path)
		this.last_y = node.coordY(_node_path)
	}

	this.import_png_image = function (_path) {
		var pngnode = S.trees.import_png_in_group(_path, "Top");
		this.set_in_line(pngnode.path)
		this.connect_to_scene_composite(pngnode.path)
		return pngnode.path
	}

	this.arrange_in_line = function (_nodes, _padding) {
		var x = node.coordX(_nodes[0])
		var y = node.coordY(_nodes[0])
		var cur_x = x
		for (var n = 1; n < _nodes.length; n++) {
			cur_x += _padding
			node.setCoord(_nodes[n], cur_x, y)
		}
	}

	this.set_opacity = function (_node, _value) {
		node.setTextAttr(_node, "OPACITY", frame.current(), _value)
	}

	this.set_enable_colorcards = function (_flag) {
		var all_cc = node.getNodes(["COLOR_CARD"])
		for (var i = 0; i < all_cc.length; i++) {
			S.log.add("[RigManager] set colocard " + all_cc[i] + " enable to " + _flag)
			node.setEnable(all_cc[i], _flag)
		}
	}

	this.get_selected_group = function () {
		var selected_nodes = selection.selectedNodes()
		for (var n in selected_nodes) {
			if (node.isGroup(selected_nodes[n])) {
				return selected_nodes[n]
			}
		}
	}

	this.import_tpl = function (_tpl_file_path, _x, _y) {

		// a better version of the same function in the tree manager class but with better ungrouping

		// create a group , import the tpl inside of it and return the nodes contained in this group 
		S.log.add("[RigManager] importing tpl " + _tpl_file_path, "file");
		var import_serial = get_unique_id()
		var temp_group_name = _tpl_file_path.split("/").join("_") + import_serial
		var import_group = $.scene.root.addNode("GROUP", temp_group_name);
		copypaste_tpl_in_group(_tpl_file_path, import_group.path);
		var updated_group = $.scene.getNodeByPath(import_group.path)
		var obj = { group_path: updated_group.path, nodes: updated_group.nodes }

		var imported_node_list = []
		var future_ungrouped_node_list = []

		for (var n in obj.nodes) {

			var node_path = obj.nodes[n].path //oNonde from openHarmony lib

			//we mark the nodes in order to find them again after ungrouping 
			add_or_set_new_text_attribute(node_path, "import_serial", import_serial);
			imported_node_list.push(node_path)

			//guess
			var slashes = node_path.split("/")
			var trimed = []
			for (var i = 0; i < slashes.length - 2; i++) {
				trimed.push(slashes[i])
			}
			trimed.push(slashes[slashes.length - 1])
			var ungrouped_path = trimed.join("/")
			future_ungrouped_node_list.push(ungrouped_path)
			print("ungrouped_path")
			print(ungrouped_path)

		}

		//move the imported nodes while inside the temp group 
		var X = _x != undefined ? _x : 0
		var Y = _y != undefined ? _y : 0
		var root_X = 0
		var root_Y = 0
		for (var n in imported_node_list) {
			if (imported_node_list[n] != undefined) {
				var curr = imported_node_list[n]
				if (n == 0) {
					root_X = node.coordX(curr)
					root_Y = node.coordY(curr)
					node.setCoord(curr, X, Y)
					continue
				}
				var new_x = X + (node.coordX(curr) - root_X)
				var new_y = Y + (node.coordY(curr) - root_Y)
				node.setCoord(curr, new_x, new_y)
			}
		}

		//ungroup the temp group 
		node.explodeGroup(import_group)

		//we search again for the nodes after ungrouping by the import_serial
		var real_ungrouped_node_list = {
			"nodes": [],
			"table": {}
		}
		for (u in future_ungrouped_node_list) {
			var curr_path = future_ungrouped_node_list[u]
			var found_node = ""
			//we test many ungrouping variations renaming
			for (var i = 0; i < 10; i++) {
				var current_variation = curr_path
				if (i > 0) {
					current_variation = curr_path + "_" + i //mynode_1 mynode_2 mynode_3 ect...
				}
				if (node.type(current_variation) == "") {
					continue
				}
				if (check_attr(current_variation, "import_serial", import_serial) == false) {
					continue
				}
				found_node = current_variation
			}
			if (found_node == "") {
				break
			}
			real_ungrouped_node_list.nodes.push(found_node)
			real_ungrouped_node_list.table[curr_path] = found_node
		}
		print(real_ungrouped_node_list)
		return real_ungrouped_node_list

	}

	function check_attr(_node_path, _attr_name, _value) {
		var value = node.getTextAttr(_node_path, frame.current(), _attr_name)
		if (node.getTextAttr(_node_path, frame.current(), _attr_name) === _value) {
			return true
		}
		print("bad " + value)
		return false
	}

	function copypaste_tpl_in_group(_tpl_file_path, _group_scene_path) {
		if (_group_scene_path != null) {
			var myCopyOptions = copyPaste.getCurrentCreateOptions();
			var myPasteOptions = copyPaste.getCurrentPasteOptions();
			myPasteOptions.extendScene = false;
			var myDragObject = copyPaste.copyFromTemplate(_tpl_file_path, 0, 0, myCopyOptions);
			copyPaste.pasteNewNodes(myDragObject, _group_scene_path, myPasteOptions);
			return true;
		}
		S.log.add("[TreeManager][copypaste_tpl_in_group]  group error " + _group_scene_path, "warning")
		return false;
	}

	this.get_attribute_names_list = function (_node) {

		//MessageLog.trace(arguments.callee.name)

		var attrList = node.getAttrList(_node, frame.current(), "");
		var name_list = Array();

		for (var i = 0; i < attrList.length; i++) {
			var attr = attrList[i];
			var a_name = attr.keyword();
			var sub_attr = attr.getSubAttributes()
			name_list.push(a_name);

			if (sub_attr.length > 0) {
				for (var j = 0; j < sub_attr.length; j++) {
					attrList.push(sub_attr[j]);
					var sub_attr_name = sub_attr[j].fullKeyword()
					name_list.push(sub_attr_name);
				}
			}
		}
		return name_list;
	}

	this.recursive_link_out_to_top_group = function (_node) {
		var multiport_out = S.rig.find_sibling(_node, "Multi-Port-Out")
		if (multiport_out == "") {
			return _node
		}
		S.rig.connect_out(_node, multiport_out)
		var parent_group = S.rig.get_group(_node)
		if (parent_group == "" || parent_group == "Top") {
			return _node
		}
		return this.recursive_link_out_to_top_group(parent_group)
	}



	this.get_linked_columns = function (_node) {
		/* return a dict : {
			"attribute_name" : column instance,
			"attribute_name" : column instance, 
			"attribute_name" : column instance 
		}*/
		var dict = {}
		var attr_list = this.get_attribute_names_list(_node);
		for (var i = 0; i < attr_list.length; i++) {
			var attribute_name = attr_list[i]
			var linked_column = node.linkedColumn(_node, attribute_name)
			if (linked_column == undefined || linked_column == "") {
				continue
			}
			dict[attribute_name] = linked_column
		}
		return dict
	}

	this.link_attributes = function (_node_A, _attr_A, _node_B, _attr_B) {
		//does the node B has attribute B ? 
		var attributes_of_B = this.get_attribute_names_list(_node_B)
		if (!attributes_of_B.indexOf(_attr_B) == -1) {
			S.log.add("[RigManager][node_B] cannot find attr " + _attr_B + " in " + _node_B)
			print(attributes_of_B)
			return false
		}
		//does the node A has attribute A and a column linked to it ? 
		var columns_of_A = this.get_linked_columns(_node_A)
		if (!(_attr_A in columns_of_A)) {
			S.log.add("[RigManager][node_A] cannot find attr " + _attr_A + " in " + _node_A)
			var attributes_of_A = this.get_attribute_names_list(_node_A)
			print(attributes_of_A)
			return false
		}
		var column_A = columns_of_A[_attr_A]
		node.linkAttr(_node_B, _attr_B, column_A);
	}


	this.get_columns_of_nodes = function (_node_list, _filter_types, _filter_attributes) {
		var ctypes = _filter_types != undefined ? _filter_types : []
		var anames = _filter_attributes != undefined ? _filter_attributes : []
		var filtered_columns = []
		for (var n = 0; n < _node_list.length; n++) {
			var curr = _node_list[n]
			var colmuns = this.get_linked_columns(curr)
			for (attr in colmuns) {
				if (anames.length > 0 && (attr in anames) == false) {
					continue
				}
				var col = colmuns[attr]
				if (ctypes.length > 0 && (colmun.type(colmuns[attr]) in ctypes) == false) {
					continue
				}
				filtered_columns.push(col)
			}
		}
		return filtered_columns
	}

	this.copy_transform = function (_giver, _reciever) {
		MessageLog.trace("COPY TRANSFORM")
		var coord_keys = [
			"POSITION.X",
			"POSITION.Y",
			"POSITION.Z",
			"SCALE.X",
			"SCALE.Y",
			"SCALE.XY",
			"ROTATION.ANGLEZ",
			"POSITION.SEPARATE",
			"SKEW"
		]
		MessageLog.trace(_giver)
		MessageLog.trace(_reciever)
		for (var c = 0; c < coord_keys.length; c++) {
			var key = coord_keys[c]
			print(key)
			var value = node.getTextAttr(_giver, frame.current(), key)
			node.setTextAttr(_reciever, key, frame.current(), value, 0)

		}

	}

	this.get_all_group_pegs = function (_node_path) {
		var basket = []
		recursive_search([_node_path], basket, ["PEG"])
		return basket
	}

	function recursive_search(_nodes_list, _basket, _types) {
		var types = _types != undefined ? _types : []
		for (var n = 0; n < _nodes_list.length; n++) {
			if (_basket.length > 10000) {
				MessageLog.trace("WARNING : max recursion reached " + n)
				return _basket
			}
			var currentNode = _nodes_list[n];
			if (node.isGroup(currentNode)) {
				var sub_nodes = node.subNodes(currentNode)
				recursive_search(sub_nodes, _basket, types)
			} else {
				if (types.length == 0 || types.indexOf(node.type(currentNode) != -1)) {
					_basket.push(currentNode)
				}
			}
		}
	}


	//use this
	function _non_recursive_search(_nodes_list, _types) {
		var basket = []
		var search_list = _nodes_list
		var types = _types != undefined ? _types : []
		for (var n = 0; n < search_list.length; n++) {
			if (search_list.length > 200000) {
				MessageLog.trace("[RigManager] WARNING : max recursion reached " + n)
				// break recursion 
				return basket
			}
			var currentNode = search_list[n];

			if (node.isGroup(currentNode) == true) {
				var sub_nodes = node.subNodes(currentNode)
				search_list = search_list.concat(sub_nodes)
				if (types.indexOf("GROUP") != -1) {
					basket.push(currentNode)
				}
				continue
			}
			if (types.length == 0) {
				basket.push(currentNode)
				continue
			}
			if (types.indexOf(node.type(currentNode)) == -1) {
				continue
			}
			basket.push(currentNode)
		}
		return basket
	}

	this.find_nodes = function (_node_search) {
		var table = {
			"nodes": []
		}
		var groups = this.get_all_interesting_groups()
		var paths_to_test = []
		for (var n in _node_search) {
			//start with the perfect match
			var current_test = _node_search[n]
			if (this.node_exists(current_test) == true) {
				if (table[_node_search[n]] == undefined) {
					table[_node_search[n]] = []
				}
				table[current_test].push(current_test)
				continue
			}
			// start guessing 
			var search_parts = _node_search[n].split("/")
			if (search_parts.length == 1) {
				paths_to_test = this.generate_group_paths(_node_search[n], groups)
			} else {
				paths_to_test = this.complete_node_path(_node_search[n], groups)
			}
			for (var p in paths_to_test) {
				current_test = paths_to_test[p]
				if (table.nodes.indexOf(current_test) != -1) {
					continue
				}
				if (table[_node_search[n]] == undefined) {
					table[_node_search[n]] = []
				}
				if (this.node_exists(current_test) == false) {
					continue
				}
				table[_node_search[n]].push(current_test)
				table.nodes.push(current_test)
			}

		}
		print(table)
		return table
	}

	function _get_node_name(_node_path) {
		var split = _node_path.split("/")
		return split[split.length - 1]
	}

	this.get_node_value = function (_node_path, _attribute_name) {
		return node.getTextAttr(_node_path, frame.current(), _attribute_name)
	}
	this.set_node_value = function (_node_path, _attribute_name, _value) {
		return node.getTextAttr(_node_path, frame.current(), _attribute_name)
	}
	this.set_exposition = function (_read, _sub_name, _frame) {
		var scene_length = scene.getStopFrame() + 1
		var dnode = OO.doc.getNodeByPath(_read);
		var drawingAttribute = dnode.attributes.drawing.element
		if (_frame == "all") {
			for (var f = 0; f < scene_length; f++) {
				drawingAttribute.setValue(_sub_name, f);
			}
			return
		}
		drawingAttribute.setValue(_sub_name, _frame);
	}

	this.find_nodes_by_keyword = function (_root_group, _key_word, _types) {
		var types = _types != undefined ? _types : []
		var root_group = _root_group != undefined ? _root_group : "Top"
		var match = []
		var nodes_of_type = _non_recursive_search([root_group], types)
		MessageLog.trace("[RigManager] found (" + nodes_of_type.length + ") nodes of type (" + _types + ") in group (" + _root_group + ")")
		for (var n = 0; n < nodes_of_type.length; n++) {
			if (nodes_of_type[n] == undefined) {
				continue
			}
			var curr = nodes_of_type[n]
			var curr_name = _get_node_name(curr)
			if (curr_name.indexOf(_key_word) == -1) {
				continue
			}
			MessageLog.trace("[RigManager] Node (" + curr + ") Matches (" + _key_word + ")")
			match.push(curr)
		}
		return match
	}

	this.find_nodes_by_type = function (_root_group, _types) {
		var types = _types != undefined ? _types : []
		var root_group = _root_group != undefined ? _root_group : "Top"
		var match = []
		var nodes_of_type = _non_recursive_search([root_group], types)
		MessageLog.trace("[RigManager] found (" + nodes_of_type.length + ") nodes of type (" + _types + ") in group (" + _root_group + ")")
		for (var n = 0; n < nodes_of_type.length; n++) {
			if (nodes_of_type[n] == undefined) {
				continue
			}
			var curr = nodes_of_type[n]
			MessageLog.trace("[RigManager] Node (" + curr + ") Matches (" + nodes_of_type[n] + ")")
			match.push(curr)
		}
		return match
	}


	this.find_sibling = function (_node_path, _sibling) {
		/*
			Top/nodeA  check if there is sibling Top/nodeB
		*/
		if (_node_path == undefined) {
			S.log.add("undefined sibling _node_path argument for " + _sibling)
			return ""
		}
		if (_node_path.split == undefined) {
			S.log.add("not a string")
			return ""
		}
		var parts = _node_path.split("/")
		var sibling = _sibling
		if (_sibling.split("/")[0] == "Top") {
			sibling_without_top = _sibling.split("/").slice(1).join('/')
			sibling = sibling_without_top
		}
		parts.pop()
		parts.push(sibling)
		var sibling_path = parts.join("/")
		if (this.node_exists(sibling_path) == true) {
			return sibling_path
		}
		return ""
	}

	this.complete_node_path = function (_path, _groups) {

		//we combine --- Top/groupB/groupA/
		//with ----------groupA/nodeA
		//to make -------Top/groupB/groupA/nodeA

		var search_parts = _path.split("/")
		if (search_parts.length < 2) {
			return []
		}
		var group_parts = []
		var first_part = search_parts[0]
		for (var g in _groups) {
			var curr = _groups[g]
			var parts = curr.split("/")
			if (first_part != parts[parts.length - 1]) {
				continue
			}
			group_parts.push(parts)
		}
		var paths = []
		search_parts.shift()
		for (var p in group_parts) {
			paths.push(group_parts[p].concat(search_parts).join("/"))
		}
		print("COMPLETED_paths")
		print(paths)
		return paths
	}

	this.generate_group_paths = function (_path, _groups) {
		var paths = []
		var group_parts = []
		for (var g in _groups) {
			var curr = _groups[g]
			group_parts = curr.split("/")
			group_parts.push(_path)
			var combine = group_parts.join("/")
			paths.push(combine)
		}
		return paths
	}

	this.insert_node = function (_args) {

		var mandatory_keys = ["insert", "between", "and"]

		for (var m in mandatory_keys) {
			if (_args[mandatory_keys[m]] == undefined) {
				S.log.add("aborting insertion missing mandatory argument ( " + mandatory_keys[m] + ")")
				return false
			}
		}

		var between = _args["between"]
		if (Array.isArray(between) == false) {
			between = [_args["between"]]
		}

		var and = _args["and"]
		if (Array.isArray(and) == false) {
			and = [_args["and"]]
		}



		var inserted = []
		for (var b = 0; b < between.length; b++) {
			if (and[b] == undefined) {
				S.log.add("ABORT and[" + b + "] is undefined ")
				continue
			}
			if (between[b] == undefined) {
				S.log.add("ABORT between[" + b + "] is undefined ")
				continue
			}
			_args.insert["root_node"] = between[b]
			var local_and = this.find_sibling(between[b], and[b])
			if (local_and == "") {
				S.log.add("aborting insertion cannot find sibbling node ( " + and[b] + ")")
				continue
			}
			var new_node = this.add_node(_args.insert)
			this.disconnect_out(between[b], local_and)
			this.connect_out(between[b], new_node)
			this.connect_out(new_node, local_and)
			inserted.push(new_node)
		}
		return inserted

	}


	this.create_node = function (_args, _x, _y) {

		var mandatory_keys = ["type", "root_node"]
		var new_path = ""
		for (var m in mandatory_keys) {
			if (_args[mandatory_keys[m]] == undefined) {
				S.log.add("aborting insertion missing mandatory argument ( " + mandatory_keys[m] + ")")
				return false
			}
		}
		var root_node = _args["root_node"]
		if (_args["type"] == "TPL" && _args['path'] != undefined) {
			var tpl_nodes = this.import_tpl(_args["path"], _x, _y)
			new_path = tpl_nodes.nodes[0]
		} else {
			var name = _args["type"] + "_" + get_unique_id()
			node.add(this.get_group(root_node), name, _args["type"], _x, _y, 0)
			new_path = this.get_group(root_node) + "/" + name
		}

		return new_path
	}

	// WIIP !
	this.add_node = function (_args) {

		//{"type":"MatteResize","params":{"value":1},"root_node":"Top/mynode"}

		var mandatory_keys = ["type", "root_node"]
		for (var m in mandatory_keys) {
			if (_args[mandatory_keys[m]] == undefined) {
				S.log.add("aborting insertion missing mandatory argument ( " + mandatory_keys[m] + ")")
				return false
			}
		}
		var x = node.coordX(_args["root_node"]) + 100
		var y = node.coordY(_args["root_node"]) + 100
		var new_path = this.create_node(_args, x, y)
		if (_args["params"] != undefined) {
			for (var p in _args["params"]) {
				node.setTextAttr(new_path, p, 1, _args["params"][p])
			}
		}
		print("created " + new_path)
		return new_path
	}

	this.flatten_scene_composite = function () {

		/*
			T: 17:18:34.129 COMPOSITE_MODE = As Bitmap
			T: 17:18:34.129 COMPOSITE_2D = Y
		*/

		var composite = this.find_scene_composite()
		if (composite == false) {
			S.log.add("ERROR could not find scene composite")
			return false
		}

		node.setTextAttr(composite, "COMPOSITE_MODE", frame.current(), "As Bitmap");
		node.setTextAttr(composite, "COMPOSITE_2D", frame.current(), "Y");
		node.setTextAttr(composite, "COMPOSITE_3D", frame.current(), "N");

	}

	this.unflatten_scene_composite = function () {

		/*
			T: 17:18:34.129 COMPOSITE_MODE = As Bitmap
			T: 17:18:34.129 COMPOSITE_2D = Y
		*/

		var composite = this.find_scene_composite()
		if (composite == false) {
			S.log.add("ERROR could not find scene composite")
			return false
		}

		node.setTextAttr(composite, "COMPOSITE_MODE", frame.current(), "Pass Through");
		node.setTextAttr(composite, "COMPOSITE_2D", frame.current(), "N");
		node.setTextAttr(composite, "COMPOSITE_3D", frame.current(), "Y");

	}


	this.get_group_connections = function (_group_path) {
		var multiport_out = _group_path + "/Multi-Port-Out"
		var innodes = this.get_linked_in_nodes(multiport_out)

		return innodes

	}

	this.get_outport_of_node = function (_node, _dst) {
		var innodes = this.get_linked_in_nodes_table(_dst)
		for (var i in innodes) {
			if (innodes[i] == _node) {
				return i
			}
		}
	}

	this.get_group_interconnections = function (_group_path) {

		var multiport_out = _group_path + "/Multi-Port-Out"
		var innodes = this.get_linked_in_nodes_table(multiport_out)
		var outnodes = this.get_linked_out_nodes_table(_group_path)
		for (var n in innodes) {
			var port = n
			print(port)
			if (outnodes[n] == undefined) {
				continue
			}
			for (var on in outnodes[n]) {
				if (node.type(outnodes[n][on]) == "MULTIPORT_OUT") {
					var next_port = this.get_outport_of_node(innodes[n], outnodes[n][on])
					print("NEXT")
					print(next_port)
				}
			}
			print(outnodes[n])
		}
		return innodes
	}

	this.set_enable_commands = function (_flag) {

		var repports = []
		var search = this.find_nodes(
			[
				"COMMANDES_C",
				"COMMANDE-C",
				"COMMANDES-C",
				"COMMANDE-C_2",
				"CHARACTER",
				"COMMANDE_BACKGROUND",
				"CPST_COMMANDES",
				"TOGGLE_COMMANDES",
				"MASTER_CONTROLER_C",
				"MASTER_CONTROLLER_C",
				"CPST_HANDLE",
				"CPST_VISIBILITY_HANDLE",
				"CPST_MCS"
			]
		)

		//deactivate

		var deactivate_list = [].concat(
			search["COMMANDES_C"],
			search["COMMANDE-C"],
			search["COMMANDES-C"],
			search["COMMANDE-C_2"],
			search["COMMANDE_BACKGROUND"],
			search["CHARACTER"],
			search["MASTER_CONTROLER_C"],
			search["MASTER_CONTROLLER_C"],
			search["CPST_VISIBILITY_HANDLE"],
			search["CPST_HANDLE"],
			search["CPST_COMMANDES"],
			search["CPST_MCS"],
			search["TOGGLE_COMMANDES"],
			node.getNodes(["MasterController"])
		)

		for (var n = 0; n < deactivate_list.length; n++) {
			var curr = deactivate_list[n]
			if (curr == undefined) {
				continue
			}
			node.setEnable(curr, _flag)
			print("deactivate : " + curr)
			repports.push("DEACTIVATED ( " + curr + " ) ")
		}

	}


	this.get_absolute_position = function (_node) {

		var parent = node.flatSrcNode(_node, 0);
		print(parent)
		var selPivot = scene.toOGL(node.getPivot(_node, frame.current()));

		var selMatrix = node.getMatrix(_node, frame.current());
		var parentMatrix = node.getMatrix(parent, frame.current());

		var localMatrix = parentMatrix.getInverse();
		localMatrix.multiplyEq(selMatrix);
		var localPOS = scene.fromOGL(localMatrix.extractPosition(selPivot, false))

		MessageLog.trace(JSON.stringify(localPOS, null, "\t"))

		return JSON.parse(JSON.stringify(localPOS, null, "\t"))

	}

	this.get_absolute_z = function (nodePath) {
		/*

			WIP 

		*/
		var zPath = [];
		var visited = {};

		function walk(path) {
			if (visited[path]) {
				return;
			}
			visited[path] = true;

			// Walk outputs
			var outLinks = node.numberOfOutputPorts(path);
			for (var o = 0; o < outLinks; o++) {
				var numLinks = node.numberOfOutputLinks(path, o);
				for (var l = 0; l < numLinks; l++) {
					var dstNode = node.dstNode(path, o, l);

					// Only composites define stacking
					if (node.type(dstNode) !== "COMPOSITE") {
						continue;
					}

					// Find which input index this node occupies
					var inPorts = node.numberOfInputPorts(dstNode);
					for (var i = 0; i < inPorts; i++) {
						var src = node.srcNode(dstNode, i, 0);
						if (src === path) {
							zPath.push(i);
							walk(dstNode);
							return; // only one render path matters
						}
					}
				}
			}
		}

		walk(nodePath);
		return zPath;
	}

	/**
	 * Returns true if the node has ANY key or exposure at the given frame.
	 */
	this.has_key = function hasKey(nodePath, frame) {
		var attrs = node.getAttrList(nodePath, frame);

		for (var i = 0; i < attrs.length; i++) {
			var attr = attrs[i];
			var col = attr.getLinkedColumn();

			if (!col) {
				continue;
			}

			// Drawing substitutions (exposure)
			if (column.type(col) === "DRAWING") {
				var exposure = column.getEntry(col, 1, frame);
				if (exposure && exposure !== "") {
					return true;
				}
			}
			// Animated columns
			else {
				if (column.isKeyFrame(col, frame)) {
					return true;
				}
			}
		}
		return false;
	}



	this.get_node_keyframes = function (nodePath) {
		var result = [];
		var seen_frames = {};

		print(nodePath)

		var totalFrames = frame.numberOf();
		var attrs = this.get_attribute_names_list(nodePath)

		for (var i = 0; i < attrs.length; i++) {

			var attr = attrs[i];
			var col = node.linkedColumn(nodePath, attr);

			if (!col) {
				continue;
			}

			var last_expo = false
			var last_column_keys = [0,0,0,0]

			for (var f = 1; f <= totalFrames; f++) {

				if(seen_frames[f]==true){
					continue
				}

				// Drawing exposure
				if (column.type(col) === "DRAWING") {
					var exposure = column.getEntry(col, 1, f);
					if (last_expo == exposure){
						continue
					}
					print(exposure)
					last_expo = exposure
					seen_frames[f] = true;
					result.push(f);
					continue
				
				}

				var value_changed = false

				// Animated column
				for (var s = 0; s <= 3; s++) {
					var sub_key = column.getEntry(col, s, f);
					if(last_column_keys[s]!=sub_key){
						value_changed = true
						break
					}

				}

				if(value_changed){
					// Animated column
					for (var s = 0; s <= 3; s++) {
						var sub_key = column.getEntry(col, s, f);
						last_column_keys[s] = sub_key
					}
					seen_frames[f] = true;
					result.push(f);
				}

				
			}
		}
		return result;
	}

	/**
	 * Returns a sorted array of unique frame numbers
	 * where ANY node in the list has a key (column or exposure).
	 */
	this.get_merged_keyframes = function (nodePaths) {
		var merged = {};
		var result = [];

		for (var n = 0; n < nodePaths.length; n++) {
			var nodePath = nodePaths[n];
			var frames = this.get_node_keyframes(nodePath);

			for (var i = 0; i < frames.length; i++) {
				merged[frames[i]] = true;
			}
		}

		// Convert hash to sorted array
		for (var frameNum in merged) {
			result.push(parseInt(frameNum, 10));
		}

		result.sort(function (a, b) { return a - b; });
		return result;
	}

	this.add_peg_to = function(child_node,name,_x,_y,_z){
		const created = this.add_node_over("PEG",name,child_node)
		this.connect_out(created,child_node)
		const x =_x!=undefined ? _x : 0
		const y =_y!=undefined ? _y : 0
		const z =_z!=undefined ? _z : 0
		node.setTextAttr(created,"POSITION.SEPARATE", frame.current(),"On");
		node.setTextAttr(created, "POSITION.X", frame.current(),x);
		node.setTextAttr(created, "POSITION.Y", frame.current(),y);	
		node.setTextAttr(created, "POSITION.Z", frame.current(),z);	
		return created
	}

	this._generate_unique_node_name=function(_prefix){
		const prefix = _prefix != undefined ? _prefix : "node"
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz";
		var id = "";
		var i;
		for (i = 0; i < 8; i++) {
			id += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return prefix + "-" + id;
	}
	
	
	this.add_composite_to = function(parent_node,_name,_comp_mode){
		const name = _name!=undefined ? _name : this._generate_unique_node_name("Comp")
		const comp_mode =_comp_mode!=undefined ? _comp_mode : "Pass Through"
		const created = this.add_node_bellow("COMPOSITE",name,parent_node)
		node.setTextAttr(created, "COMPOSITE_MODE", frame.current(),comp_mode);
		node.setTextAttr(created, "FLATTEN_OUTPUT", frame.current(),"Y");
		node.setTextAttr(created, "COMPOSITE_2D", frame.current(),"N");
		node.setTextAttr(created, "COMPOSITE_3D", frame.current(),"N");
		this.connect_out(parent_node,created)
		return created
	}
	
	this.____connect_to_new_composite = function(node_list,_name,_comp_mode){
		
		// this function make toonboom crash for undefined reason ... 
		const name = _name!=undefined ? _name : this._generate_unique_node_name("Comp")
		const comp_mode =_comp_mode != undefined ? _comp_mode : "Pass Through"
		if(node_list.length==0){
			return ""
		}
		const first = node_list[0]
		var created = this.add_node_bellow("COMPOSITE",name,first)
		node.setTextAttr(created, "COMPOSITE_MODE", frame.current(),comp_mode);
		node.setTextAttr(created, "FLATTEN_OUTPUT", frame.current(),"Y");
		node.setTextAttr(created, "COMPOSITE_2D", frame.current(),"N");
		node.setTextAttr(created, "COMPOSITE_3D", frame.current(),"N");
		for(var n in node_list){
			if(n==0){
				continue
			}
			var current = node_list[n]
			this.connect_out(current,created)
		}
		return created
	}



}

