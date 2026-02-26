// CLASS OO_TreeManager

/*

TREE AND NODES SHOULD BE HANDLE IN A CLEANER WAY 
it's not clear how to find the nodes related to the tree. 
when they chang group for exemple 
the nodes shoul be a simple array of nodes not a GroupeNode object 
the trees should have a node_map. 

*/

OO.TreeManager = function(_S){
	
	var S = _S;
	this.list = [];
	this.module_path = "P:/pipeline/script_modules/TreeMap/TreeMap.tpl";
	
	// CREATE TREE 
	
	//obsolete
	this.add = function(_code,_nodes){
		
		var ntree = new OO.Tree(_code,_nodes);
		//var script_module = this.add_tree_module(_code,_nodes);

		this.list.push(ntree);
		return ntree;
		
	}
	
	this.add_tree = function(_code,_nodes){
		
		// intance of class Tree , see OO_Clas_Tree.js
		var ntree = new OO.Tree(_code,_nodes);
		
		// marking nodes with unique id
		
		var tree_nodes = ntree.get_nodes();
		this.add_id_to_nodes(tree_nodes)
		
		//for the id to be writen in the xstage 
		scene.saveAll();
		
		// FINDING AND SETTING TOP AND BOTTOM NODES
		if(tree_nodes.length > 0){
		
			var node_to_link = tree_nodes[0];
			var found_top_node = ntree.find_top_node();
			
			if(found_top_node != false){
				ntree.set_top_node(found_top_node);
				node_to_link = found_top_node;
			}
			
			var found_bottom_node = ntree.find_bottom_node();
			
			if(found_bottom_node != false){
				ntree.set_bottom_node(found_bottom_node);
			}		

			// parsing node map (list of node with their ids) 
			var node_map_string = this.stringify_node_list(tree_nodes);

			// adding linking and setting map module 
			var map_module = this.add_map_module(_code,node_to_link);
			map_module.name = "TreeMap_"+_code
			ntree.set_map_module(map_module);
			ntree.update_map_module("code",_code);
			ntree.update_map_module("node_list",node_map_string);
			ntree.update_map_module("node_count",tree_nodes.length);
			this.list.push(ntree);
		
		}
		return ntree;			
		
	}	
	
	
	// import the treemap script module from the library and link it to a given node
	// return oNode object

	this.add_map_module = function(_code,_node_to_link){
		
		//////MessageLog.trace("TOP NODE");
		
		//////MessageLog.trace(_node_to_link)
		
		var script_module = false;

		if(_node_to_link != false){
			
			var parent_group = _node_to_link.parent;
			
			if( parent_group =="Top"){
				
				parent_group =OO.doc.root;
				
			}
			
			//////MessageLog.trace(parent_group)
			
			// importing tpl as oNode object
			
			script_module = this.import_tpl_in_group(_code,this.module_path,parent_group)[0];
			
			// module name 
			

			
			// setting attritubes 
			
			script_module.attributes.code.setValue(_code);
			
			// linking node module to the top node

			script_module.linkInNode(_node_to_link);
			
			
			// position of the module : 
			
			script_module.centerBelow(_node_to_link,100,50)
			


		}

		return script_module; 		

		
	}
	
	
	// TREE ID FUNCTIONS :
	
	this.add_id_to_nodes = function(_nodes,_override){
		
		// mark nodes with unique id by adding a dynamic attribute 

		for(var s = 0 ; s < _nodes.length ; s++){
			var curn = _nodes[s];
			var layer_id = this.add_unique_id_to_onode(curn,_override);
		}
		
		
	}
	
	// create dynamic attribute "smlayerid" and fill it with ID  
	// RETURN ID
	
	this.add_unique_id_to_onode = function(_onode,_override){
		
		
		var override = _override != undefined ? _override : false;
		var layer_id = _onode.type+"_"+get_unique_id()
		
		// if the node already has an ID we jut read it 
		
		if(_onode.hasOwnProperty("smlayerid")==false){
			//adding a dynamic attribute "smlayerid"
			node.createDynamicAttr(_onode, "STRING", "smlayerid", "smlayerid", false)
			node.setTextAttr(_onode,"smlayerid",frame.current,layer_id);	
			
		}else{
			
			if(override == true){
				
				//unless we want to override the id (dangerous) 
				node.setTextAttr(_onode,"smlayerid",frame.current,layer_id);		
			}
			layer_id = _onode.smlayerid;
		}
		return layer_id;
		
		
	}

	function get_unique_id(){
		var k = Math.floor(Math.random() * 10000000);
		var m =k.toString();	
		return m ;
	}


	// TREE MAP 




	this.fetch_all_nodes_path_recursive = function(_node_path){

		var nodes_to_treat = []

		if(node.isGroup(_node_path)==true){
			nodes_to_treat.concat(this.get_sub_nodes(_node_path))
		}else{
			if(_node_path.length!=undefined){
				nodes_to_treat.concat(_node_path)
			}
		}
		
		var fetched_nodes = []

		for(var s = 0 ; s < nodes_to_treat.length ; s++){
			var curn = nodes_to_treat[s];
			if(node.isGroup(curn)){
				nodes_to_treat.concat(this.get_sub_nodes(nodes_to_treat))
			}
			fetched_nodes.push(curn);
		}

		return fetched_nodes

	}

	this.get_sub_nodes = function( _node_path ){
		
		var node_array = []
		var groups_to_read = []
		
		if(node.isGroup( _node_path)==true){
			groups_to_read.push(_node_path)
		}

		for(var g = 0 ; g < groups_to_read.length; g++){
			current_group = groups_to_read[g]; 
			for(var i =0 ;i< node.numberOfSubNodes(groups_to_read[g]);i++){
				var sub_node_path = node.subNode(groups_to_read[g],i);
				node_array.push(sub_node_path);
				if(node.isGroup(sub_node_path)==true){
					groups_to_read.push(sub_node_path)
				}
			}
		}

	  	return node_array; 
	}


	this.format_node_path_list = function(_nodes){
		
		var string ="[";
		//MessageLog.trace("_nodes")
		//MessageLog.trace(_nodes)
		for(var s = 0 ; s < _nodes.length ; s++){
			var curn = _nodes[s];
			if(s==0){
				string+='"'+curn+'"';
			}else{
				string+=',"'+curn+'"';
			}
		}

		string +="]";
		//MessageLog.trace("string")
		//MessageLog.trace(string)

		return string;		

	}





	this.stringify_node_list = function(_nodes){
		
		var map_string = "";
		for(var s = 0 ; s < _nodes.length ; s++){

			var curn = _nodes[s];
			var layer_id = this.add_unique_id_to_onode(curn);
			if(curn.hasOwnProperty("smlayerid")==true){
				var row = curn.name+":"+curn.smlayerid;
			}
			if(s==0){
				map_string+=row;
			}else{
				map_string+=",";
				map_string+=row;
			}
		}
		return map_string;		

	}
	


	
	this.parse_node_list = function(_node_list_string){ 
	
		var ID_list = [];
		
		var split_row = _node_list_string.split(","); 
		
		for(var r = 0 ; r < split_row.length; r++){
			
			var current_row = split_row[r];
			
			var split_coma = current_row.split(":"); 
			
			var ID = split_coma[1]
			
			ID_list.push(ID)
			
		}
		
		return ID_list 
		
	}	
	
	
	this.fetch_nodes_by_id = function(_ID_list){
		
		var id_to_find = _ID_list;
		var inspected_nodes = this.get_all_nodes();
		var found_nodes = []

		for(var n = 0 ; n < inspected_nodes.length ; n ++){
			
			var current_node = OO.doc.getNodeByPath(inspected_nodes[n]);
			if(current_node.hasOwnProperty("smlayerid")){

				var found_index = _ID_list.indexOf(current_node.smlayerid) 
				if(found_index != -1){
					found_nodes.push(current_node);
					id_to_find.splice(found_index, 1);
					if(id_to_find == 0){
						
						// all nodes where found
						return found_nodes;
						
					}
					
				}
				
			}
			
		}
		
		for(var i = 0 ; i <  id_to_find.length ; i ++){
			S.log.add(id_to_find[i]+" not found","search result")
		}
		
		return found_nodes;
		
	}
	
	
	this.get_node_id = function(_node){
	
		var onode = OO.doc.getNodeByPath(_node); 
		if(onode.hasOwnProperty('smlayerdid')){
			return onode.smlayerid;
		}
		return false;
	}
	
	// KEY NODES 
	
	this.add_key_node_to_tree = function(_key,_node,_tree){

		var node_id = this.get_node_id(_node);
		var key_node = {key:_key,node:node_id};
		var key_node_list = this.parse_key_node_list(_tree.get_key_notes());
		key_node_list.push(key_node);
		var key_node_list_string = this.stringify_key_nodes_list(key_node_list);
	}
	
	
	
	// READING SCENES
	

	this.find_map_modules_in_nodes = function(_nodes){
		
		var map_module_list = [];
		for(var n = 0 ; n < _nodes.length ; n ++){
		
			var current_onode = OO.doc.getNodeByPath(_nodes[n]);
			if(current_onode.type == "SCRIPT_MODULE"){
			
				if(current_onode.hasOwnProperty("treemap")){
					map_module_list.push(current_onode);
	
				}
				
			}
			
		}
		
		if(map_module_list.length == 0){
			return false;
		}
		
		return map_module_list; 
		
	}
	
	
	
	
	this.instaciate_tree_with_map_module = function(_map_module){
		
		// read the map_module attribute and instanciate a new tree object with the fetched data. 
		
		var tree_code = _map_module.code;
		var tree_id = _map_module.treeid;
		var node_list_string = OO.filter_string(_map_module.node_list)
		var id_list = this.parse_node_list(node_list_string);
		var tree_nodes = this.fetch_nodes_by_id(id_list);
		var ntree = new OO.Tree(tree_code,tree_nodes); 
		ntree.set_map_module(_map_module);
		return ntree;
		
	}
	
	
	this.get_all_nodes = function(){
	
		var groups_to_analyse = [OO.doc.root]
		var node_list = []
		
		for(var g = 0 ; g < groups_to_analyse.length ; g++){
			
			var group_nodes = groups_to_analyse[g].nodes;

			for(var n = 0 ; n < group_nodes.length ; n++){
				
				var current_node = OO.doc.getNodeByPath(group_nodes[n]);
				if(current_node.type == "GROUP"){
					groups_to_analyse.push(current_node); 
				}
				node_list.push(current_node);
			}	
		}		
		return node_list;
		
	}

	
	this.load_trees_from_scene = function(){
		
		var scene_nodes = this.get_all_nodes();
		var scene_map_modules = this.find_map_module_in_nodes(scene_nodes);
		
		for(var m = 0 ; m < scene_map_modules.length ; m++){
			
			var cur_map_module = scene_map_modules[m];
			var ntree = this.instaciate_tree_with_map_module(cur_map_module);
			this.list.push(ntree);

		}		
		
	}
	
	
	
	this.get_node_smlayerid = function(_node){
		
		if(_node.hasOwnProperty('smlayerid')){
		
			return  _node.smlayerid;
			
		}		
		
		return false;
		
	}
	
	
	
	this.find_node_by_smlayerid = function(_smlayerid){
		
		var scene_nodes = OO.doc.root.nodes;
		for(var n = 0 ; n < scene_nodes.length ; n++){		
			if(this.get_node_smlayerid(curn) == _smlayerid){
				return  curn;
			}
		}
		return false;
	}
	
	
	
	
	
	
	// EDITING TREES

	this._generate_serial = function(){
		var serial = ""
		for(var i=0;i < 6 ; i++){
			serial+=Math.round(Math.random()*9)+""
		}
		return serial
	}


	this.import_tpl_in_temp_group = function(_tpl_file_path){
		
		// create a group , import the tpl inside of it and return the nodes contained in this group 
		const temp_name = "TEMP"+_tpl_file_path+this._generate_serial()
	
		S.log.add("[TreeManager] importing tpl "+_tpl_file_path,"file");
		var import_group =  $.scene.root.addNode("GROUP",temp_name); 	
		copypaste_tpl_in_group(_tpl_file_path,import_group.path);
		var updated_group = $.scene.getNodeByPath(import_group.path)
		var obj = {group_path:updated_group.path,nodes:updated_group.nodes}
		return obj ; 

	}	
	
	this.import_tpl_in_group = function(_tpl_file_path,_group_scene_path){
		// should also be in a temp group 
		copypaste_tpl_in_group(_tpl_file_path,_group_scene_path);
		var updated_group = $.scene.getNodeByPath(_group_scene_path)
		var obj = {group_path:updated_group.path,nodes:updated_group.nodes}
		return obj ; 		
	}
	
	this.get_first_sub_group_in_group = function(_group_scene_path){
		
		var recever_group_object = $.scene.getNodeByPath(_group_scene_path)
		group_content = recever_group_object.nodes
		
		for(var no = 0 ; no < group_content.length ; no++){
			
			var current_node_object = group_content[no];
			
			if(current_node_object.type == "GROUP"){
				
				return current_node_object;
			}
			
		}
		
		return false; 
		
	}
	
	
	this.replace_group_multiports = function(_group_scene_path){

		var recever_group_object = $.scene.getNodeByPath(_group_scene_path)
		
		var multiport_out_object = recever_group_object.multiportOut
		var multiport_in_object = recever_group_object.multiportIn
		
		var multiport_out_linkin_node = multiport_in_object.outs[0]
		var multiport_in_linkout_node = multiport_out_object.ins[0]

		if(multiport_out_linkin_node != null || multiport_in_linkout_node != null){
			multiport_in_object.centerAbove(multiport_in_linkout_node, 0, -800);
			multiport_out_object.centerBelow(multiport_out_linkin_node, 0, 800);
		}else{
			S.log.add("[TreeManager] WARNING no group found in tpl","warning");
		}
		
	}
		
	








	function copypaste_tpl_in_group(_tpl_file_path,_group_scene_path){

		if(_group_scene_path != null){

			var myCopyOptions = copyPaste.getCurrentCreateOptions();
			var myPasteOptions = copyPaste.getCurrentPasteOptions();
			
			myPasteOptions.extendScene = false;
			var myDragObject = copyPaste.copyFromTemplate(_tpl_file_path,0,0,myCopyOptions);
			copyPaste.pasteNewNodes(myDragObject,_group_scene_path,myPasteOptions);
	
			return true; 

		}

		return false; 



	}

	this.delete_group_nodes = function(_group_node_path){
		var sub_nodes = node.subNodes(_group_node_path);
		for(var n = sub_nodes.length ; n > 0 ; n-- ){
			if(node.type(sub_nodes[n])!="MULTIPORT_OUT" && node.type(sub_nodes[n])!="MULTIPORT_IN"){
				node.deleteNode(sub_nodes[n],false,false);
				S.log.add("[TreeManager] DELETED "+sub_nodes[n],"node")
			}
		}
	}


	this.put_group_content_in_trash_group = function(_group_node_path){

		//var group_to_delete_name = "group_to_delete"
		//var group_to_delete_name = "group_to_delete"+Math.floor(Math.random()*1000000)
		var sub_nodes = node.subNodes(_group_node_path);
		//var temp_group = node.createGroup(sub_nodes,group_to_delete_name);

		//var nodes_to_delete =node.subNodes(temp_group); 
		for(var n = sub_nodes.length ; n > 0 ; n-- ){
			if(node.type(sub_nodes[n])!="MULTIPORT_OUT" && node.type(sub_nodes[n])!="MULTIPORT_IN"){
				node.deleteNode(sub_nodes[n],false,false);
				S.log.add("[TreeManager] DELETED "+nodes_to_delete[n],"node")
			}
		}
		//node.deleteNode(temp_group,false,false);
		//S.log.add("[TreeManager] puting to trash  "+temp_group,"node")
		/*this.disconnect_node(temp_group)
		var trash_group = node.createGroup([],"trash");
		node.moveToGroup(temp_group, trash_group);*/
	}


	this.disconnect_node = function(_node_path){

		var myNodeDestination = node.dstNode(_node_path, 0 , 0);
		node.unlink(myNodeDestination, 0);
		node.unlink(_node_path, 0);

	}
	

	
	this.scale_bg_node_to_png_size_with_cadre = function(_node_path,_png_path,_cadre){

		if( _cadre.hasOwnProperty('bg')==false){
			S.log.add("[TreeManager] WARNING could find bg prop in cadre ")
		}else{
			var final_sy = parseFloat( _cadre.bg.height/1080)
			var final_sx = final_sy;
				
			//changin node scale
			node.setTextAttr(_node_path, "SCALE.XY", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.X", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.Y", frame.current(),final_sx);	
		}
	
	}

	this.scale_bg_node_to_png_size = function(_node_path,_png_path){

		var png_image_object = new OO.ImageFile(_png_path)
		var dimention_object = png_image_object.get_dimention_object();

		if(dimention_object == false){
			S.log.add("[ImageFile] WARNING could not create or find dimention txt")
		}else{
			var final_sy = parseFloat(dimention_object.height/1080)
			var final_sx = final_sy;
				
			//changin node scale
			node.setTextAttr(_node_path, "SCALE.XY", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.X", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.Y", frame.current(),final_sx);	
		}
	
	}

	this.scale_anim_node_to_png_size = function(_node_path,_png_path){

		var png_image_object = new OO.ImageFile(_png_path)

		var dimention_object = png_image_object.get_dimention_object();
		if(dimention_object == false){
			S.log.add("[ImageFile] WARNING could not create or find dimention txt")
		}else{
			var final_sy = parseFloat(dimention_object.height/1080)

			//a quick fix for data that wasn't working (harmony need 3 instead of 2.13)
			if(final_sy > 2 ){
				final_sy = 3;
			}
			var final_sx = final_sy;

			node.setTextAttr(_node_path, "SCALE.XY", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.X", frame.current(),final_sx);				
			node.setTextAttr(_node_path, "SCALE.Y", frame.current(),final_sx);

				
		}
				
	} 	

	this.import_png_in_group = function(_png_path,_group_path){

		var png_file_object = new $.oFile(_png_path)
		var group = $.scene.getNodeByPath(_group_path)
		
		if(png_file_object.exists==false){
			S.log.add("WARNING png does not exist","warning")
			return false
		}
		var png_node_path = group.importImage(_png_path);
		MessageLog.trace("node exits ? "+node.type(png_node_path))
		if(node.type(png_node_path)==null){
			S.log.add("WARNING failed to create png node","warning")
			return false
		}
		MessageLog.trace("created "+png_node_path)

		var png_node = $.scene.getNodeByPath(png_node_path);
		this.extend_exposition_to_scene_length(png_node_path);
		return png_node;
							
	}
	
	this.extend_exposition_to_scene_length= function(_onode){
		var scene_length = scene.getStopFrame()+1
		var dnode = OO.doc.getNodeByPath(_onode);
		var drawingAttribute = dnode.attributes.drawing.element
		for(var f = 0 ; f < scene_length ; f++){
			drawingAttribute.setValue ("1", f);   
		}
	}
	
	
	// E X P O R T    T P L 
	

	this.export_group_to_path = function(_group,_path,_tpl_name){
		

		selection.clearSelection ()
		if(Array.isArray(_group)){
			selection.addNodesToSelection(_group)
		}else{
			selection.addNodeToSelection(_group)
		}

		var process = copyPaste.createTemplateFromSelection(_tpl_name,_path)
		S.log.add("[copyPaste] "+ process,"process")

		if(process == _tpl_name){
			S.log.add("[copyPaste] "+ process +" exported ","process")
		}else{
			S.log.add("[copyPaste] "+ process +" exported ","warning")
		}
		return true;
	}


	
	//FUNCTION TO MAKE THE NODEVIEW PRETTY 
	
	this.align_nodes = function (node_list){

		var last_x = 0; 
		var last_y = 0;	
		var last_width = 0;
		var padding = 10;
		var total_width;
		
		for(var n in node_list){
			
			var cn = node_list[n]; 

			if(n == 0 ){

				last_x = cn.x; 
				last_y = cn.y;
				last_width = cn.width;

			}else{
				
				cn.y = last_y;
				cn.x = (last_width)+last_x+padding;
				last_x = cn.x; 
				last_width = cn.width;
			}
			total_width+=cn.x;
		}	
		return total_width;
		
	}
	
	this.add_tree_id_to_node = function (onode,id){
		onode.createAttribute("tree_id", type, displayName, linkable);
	}

	
	
	this.import_psd_in_group = function(_code,_path,_group){
		var nodes = _group.importPSD(_path,true,false,false,"ASIS");  
		return nodes; 		
	}	

	this.read_Z_from_node_name = function(_node_name)
	{
		var Z = false;
	
		if (!_node_name)
			return Z;
	
		var valid_prefix = ['BG','OL','ch','prg'];
	
		var parts = _node_name.split("_");
		var prefix = parts[0];
	
		if (valid_prefix.indexOf(prefix) === -1)
			return Z;
	
		// Detect number at end
		var match = _node_name.match(/(_+)(\d+)$/);
	
		if (match)
		{
			var underscores = match[1]; // "_" or "__"
			var number = match[2];      // digits only
	
			if (underscores.length === 2)
				Z = "-" + number; // double underscore = negative
			else
				Z = number;       // single underscore = positive
			return Z
		}
	
		return false;
	};
	

	this.arange_psd_node = function(_tree,_code){
		
		//////////MessageLog.trace("ARRANGE PSD NODES");
		
		var code = _code != undefined ? _code : "nocode";
		var reads = _tree.get_reads();
		var group = _tree.get_parent_group();
		this.align_nodes(reads);
		
		var top_peg = group.addNode("PEG",_tree.get_code()+"-P")
		_tree.set_key_node("top_peg",top_peg);
		var final_comp = group.addNode("COMPOSITE",_tree.get_code()+"-C");
		_tree.set_key_node("final_comp",final_comp); 

		group.multiportIn.linkOutNode(top_peg,0,0,true);
		final_comp.linkOutNode(group.multiportOut,0,0,true);
		final_comp.attributes.composite_mode.setValue("Pass Through");
		
		
		var z_factor = 0.001;

		//adding asset code and id 
		S.rig.mark_node(top_peg,code)
		S.rig.mark_node(final_comp,code)

		var last_z = false
		
		for(var r = reads.length-1 ; r >= 0 ; r--){
			
			var cr = $.scene.getNodeByPath(reads[r]); 

			//adding asset code and id 
			S.rig.mark_node(cr,code)

			if(cr != undefined){

				var npeg = group.addNode("PEG",cr.name+"-P",new $.oPoint(cr.x,cr.y-40,0))
				top_peg.linkOutNode(npeg);
				cr.linkOutNode(final_comp);

				//adding asset code and id 
				S.rig.mark_node(npeg,code)

				const index_Z = (reads.length-r)*z_factor;
				if(!last_z){
					last_z = index_Z
				}

				const name_Z = this.read_Z_from_node_name(cr.name)*z_factor
				if (name_Z!=false) {
					last_z = name_Z
				}else{
					last_z = last_z+z_factor
				}

				MessageLog.trace("[arange_psd_node] layer z = "+last_z)

				npeg.linkOutNode(cr);
				cr.attributes.can_animate.setValue("N");
				cr.attributes.use_drawing_pivot.setValue("Apply Embedded Pivot on Parent Peg");
				npeg.attributes.position.separate.setValue("On");
				
				npeg.attributes.position.z.setValue(last_z);

				_tree.add_node(npeg);

			}
			
			

		}
	
		top_peg.centerAbove(reads, 0, -200);
		group.multiportIn.centerAbove(reads, 0, -500);
		final_comp.centerBelow(reads, 0, 200);
		group.multiportOut.centerBelow(reads, 0, 500);
		
	}
	
	this.put_next_to = function(tree1,tree2,padding){
		
		var W = tree1.get_width(); 
		var X = tree1.get_X()+padding+W; 
		var Y = tree1.get_Y(); 
		tree2.moveTo(X,Y);
		
	}
	

	
	this.add_layout_peg = function(on){
		
		var group = on.parent;
		var npeg = group.addNode("PEG",on.name+"-P",new $.oPoint(on.x,on.y-40,0))
		npeg.linkOutNode(on);			
		
	}
	
	
	// CAMERA AND BG OPERATIONS
	
	
	//the size of the camera in bg is 10% bigger 


	this.get_linked_3D_columns = function(_node){
		
		var node_columns = Array();
		var attrList = getAttributesNameList (_node);
		for (var i=0; i<attrList.length; i++){
			var attribute_name = attrList[i]
			if(attribute_name == "POSITION.3DPATH"){
				var linked_column = node.linkedColumn(_node,attribute_name)
				if( linked_column !=""){
					node_columns = (linked_column);
				}
			}
		}
		return node_columns;
		
	}
  	
	function getAttributesNameList (snode){
		
		var attrList = node.getAttrList(snode, frame.current(),"");
		var name_list= Array();
		
		for (var i=0; i<attrList.length; i++){	
			var attr = attrList[i];
			var a_name = attr.keyword();
			var sub_attr = attr.getSubAttributes()
			name_list.push(a_name);

			if(sub_attr.length > 0){
				for (var j=0; j<sub_attr.length; j++){	
					attrList.push(sub_attr[j]);
					var sub_attr_name = sub_attr[j].fullKeyword()
					name_list.push(sub_attr_name);
				}
			}
		}
		return name_list;
		
	} 
 	
	this.get_next_3Dkey = function(_column){

		sub_column = 4;
		key = Array();
		s = 1;
		for (var f = 0 ; f<=frame.numberOf();f++){
				if(column.isKeyFrame(_column,s,f)){
				for (s = s ; s<sub_column;s++){
					key.push(column.getEntry(_column,s,f))
				}
				return key;
			}
		}
		return false;

	}
	
	this.toonboom_coords_to_float  = function(tbv){

		var result = 0
		result= tbv.split(" ")[0];
		var letter = tbv.split(" ")[1];
		if(letter == "W" || letter =="B" || letter =="S"){
			result = "-"+result;
		}
		result = parseFloat(result)
		return result

	}		 
	
	
	this.create_tree_file = function(_filepath){
		
		var file_test = new $.oFile(_filepath)
		if(file_test.exists == false){
			logfile = new PermanentFile(_filepath);
			var stamp = scene.currentScene()+"**************** NEW LOG >>>>"+OO.aujourdhui();
			logfile.open(4);                 // open with write only stream
			logfile.writeLine(stamp);           // write line to file
			logfile.close(); 						
		}
		this.path = _filepath;
		
	}


	
	
}


//MessageLog.trace("CLASS OO_TreeManager")

