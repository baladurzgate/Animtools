OO.PortalFiter  = function(_S){

    var S = _S; 
	this.current_shot = false;
	this._compensating_factor = 1
	this._used_cadre_source = ""


	//some nice constants to compensate the hell of toonboom coordonates (evrything in 4:3 by default)
	const toonboom_half_HD_width = 15.8704 // when the camera is at 0 the width is at 30
	const toonboom_half_HD_height = 12.1611 // when the camera is at 0 the width is at 30
	const toonboom_x_ratio = parseFloat(1920/(toonboom_half_HD_width*2))
	const toonboom_y_ratio = parseFloat(1080/(toonboom_half_HD_height*2))
	const toonboom_fov = parseFloat(53*2) // for a FOV of 41
	
	
    this.set_current_shot = function(_s){
		S.log.add("[PortalFiter] this.current_shot "+_s,"breakdown");; 
        this.current_shot = _s
    }

	this.set_compensating_factor = function(_f){
		this._compensating_factor = _f
	}


    this.get_current_cadre_from_psd= function(_psd_path){

        S.log.add('[PortalFiter] reading cadre directly from PSD layers','process')
        var cadre =   S.psd.get_cadre_for_shot(this.current_shot,_psd_path)
        return cadre;
    }

    this.get_current_cadre_from_svg = function(_svg_path){

        S.log.add('[PortalFiter] reading cadre from svg','process')

        var svg_path =_svg_path
        
        //old bg portals might not have svg path so we assert them py their psd
        if(svg_path == false || svg_path == ""  || svg_path == "false" ){
            if(psd_path != false || psd_path != ""  || psd_path != "false" ){
                svg_path = S.context.convert_psd_path_to_svg_path(psd_path)
            }
        }

        //we instaciate the cadre class
        S.svg.set_path(svg_path);
        var shot_cadre = S.svg.get_cadre_for_shot(this.current_shot)
        return shot_cadre; 

    }

	this.fit_portal_to_cadre = function(_portal,_cadre){

		const portal_peg = _portal.get_peg()
		if(_cadre == false || _cadre == undefined){
			S.log.add("[PortalFiter] no cadre found scaling secu by default ","warning");					
			this.scale_to_camera(portal_peg);
			return
		}
		
		if(_cadre.has_rect()==false){
			S.log.add("[PortalFiter] no cadre detected for "+this.current_shot+", scaling secu by default ","warning");					
			this.scale_to_camera(portal_peg);
			return
		}
		//we apply the transformation
		this.transform_peg_to_fit_cadre(portal_peg,_cadre);
		S.log.add("[PortalFiter] portal fit to camera and cadre "+this.current_shot,"success");				             
        
	}
		

	this.get_portal_cadre = function(_portal){

		// straigth from PSD ? 
		this.set_current_shot(S.passport.get('code'))
		var shot_cadre = this.get_current_cadre_from_psd(_portal.get_path('psd'))
		this._used_cadre_source = "psd"

		// adjust the lack of decimals  ? 
		//this.set_compensating_factor(1.14)
		this.set_compensating_factor(1)

		// in case no data where extracted from the psd 
		if(shot_cadre == undefined){
			S.log.add("[PortalFiter] reading from psd issued no data , switching back to svg  ","rollback");	
			shot_cadre = this.get_current_cadre_from_svg(_portal.get_path('svg'))
			this._used_cadre_source = "svg"
			// no need to compensate
			this.set_compensating_factor(1)
		}

		print(shot_cadre.to_string())
	
		// validate 
		if(shot_cadre.has_rect()==false){
			S.log.add("[PortalFiter] found cadre is not valid : no valid rectangle coords ","warning");					
			return
		}

		return shot_cadre
	}

    this.fit_portal_to_camera = function(_portal){
        const shot_cadre = this.get_portal_cadre(_portal)
		this.fit_portal_to_cadre(_portal,shot_cadre)
		
    }

    this.fit_portals_to_camera = function(_bg_portal,_portals){
        const shot_cadre = this.get_portal_cadre(_bg_portal)
		for (var p in _portals){
			this.fit_portal_to_cadre(_portals[p],shot_cadre)
		}
    }

	
	this.scale_to_camera = function(top_peg){
		
		var SECU_W = 2111.99;	
		var cam_w= 1920;
		var ratio = cam_w /SECU_W; 
		
		//INJECT SX
		top_peg.attributes.scale.x.setValue(ratio);
		
		//INJECT SY
		top_peg.attributes.scale.y.setValue(ratio);		
		
	}


	this.camera_z_to_width  =function(_camera_z){

		var half_radian_angle = parseFloat((toonboom_fov/2)*Math.PI/180)
		var tangent = parseFloat(Math.tan(half_radian_angle))
		var width = parseFloat(((tangent * _camera_z)+toonboom_half_HD_width) * 2)
		var HD = 1080/1920
		var height = parseFloat(width*HD)
		MessageLog.trace("half width = " + toonboom_half_HD_width);
		MessageLog.trace("camera fov = " + toonboom_fov);
		var obj = {
			width:width,
			height:height,
			pixel_width:parseFloat(width*toonboom_x_ratio),
			pixel_height:parseFloat(height*toonboom_x_ratio),
			scale_x:parseFloat(width/(toonboom_half_HD_width*2)),
			scale_y:parseFloat(height/(toonboom_half_HD_height*2))
		}
		S.log.add("[PortalFiter] Camera Z ( "+_camera_z+" ) means an actual width of ( "+obj.pixel_width+" )","info");
		return obj

	}


	this.validate_cadre = function(_cadre){

		if(_cadre.hasOwnProperty('rect')!=true){
			S.log.add("the cadre has no rect key")
			return false
		}

		if(_cadre.hasOwnProperty('bg')!=true){
			S.log.add("the cadre has no bg key ")
			return false
		}

		if(_cadre.bg==undefined){
			return false
		}

		if(_cadre.bg.width==undefined){
			return false
		}

		if(_cadre.rect==undefined){
			return false
		}

		return true

	}


    this.transform_peg_to_fit_cadre = function(top_peg,cadre){
		
		if(this.validate_cadre(cadre)==false){
			MessageLog.trace("ERROR : Cadre is not valid")
			return false
		}
		//Values 


		var bg = {
			w:cadre.bg.width,
			h:cadre.bg.height,
			cx:parseFloat(cadre.bg.width/2),
			cy:parseFloat(cadre.bg.height/2)
		}
			
		var cadre = {
			x:cadre.rect.x,
			y:cadre.rect.y,
			w:cadre.rect.width,
			h:cadre.rect.height
		}	

		const camera = this.get_camera_coords();

		S.log.add("[PortalFiter] input cadre Bg.width ( "+bg.w+" )","info");
		S.log.add("[PortalFiter] input cadre Bg.height ( "+bg.h+" ) ","info");
		S.log.add("[PortalFiter] input cadre rect.width ( "+cadre.w+" )","info");
		S.log.add("[PortalFiter] input cadre rect.height( "+cadre.h+" )","info");
		S.log.add("[PortalFiter] input cadre rect.x ( "+cadre.x+" )","info");
		S.log.add("[PortalFiter] input cadre rect.y ( "+cadre.y+" )","info");

		const final = this.calculate_final_coords(camera,bg,cadre)

		if(final.sx != NaN && final.sy != NaN && final.x != NaN && final.y != NaN){
			this.apply_coords(top_peg,final)
		}else{
			S.log.add("[PortalFiter]  - NaN values X = "+final.x+ " Y = "+final.y+ " Z = "+final.z,"warning");
		}
	
	}


	this.apply_coords = function (_peg,_coords){


			node.setTextAttr(_peg.path,"SCALE.SEPARATE", frame.current(),"On");
			node.setTextAttr(_peg.path,"POSITION.SEPARATE", frame.current(),"On");

			//INJECT X
			_peg.attributes.position.x.setValue(_coords.x);
			
			//INJECT Y
			_peg.attributes.position.y.setValue(_coords.y);
			
			//INJECT Z
			_peg.attributes.position.z.setValue(_coords.z);
			
			//INJECT SX
			_peg.attributes.scale.x.setValue(_coords.sx);
			
			//INJECT SY
			_peg.attributes.scale.y.setValue(_coords.sy);
			
			S.log.add("[PortalFiter]  - changing bg scale SX = "+_coords.sx,"process");
			S.log.add("[PortalFiter]  - changing bg scale SY = "+_coords.sy,"process");
			S.log.add("[PortalFiter]  - changing bg position X = "+_coords.x,"process");
			S.log.add("[PortalFiter]  - changing bg position Y = "+_coords.y,"process");
			S.log.add("[PortalFiter]  - changing Z = "+_coords.z,"process");

	}

	this.is_zero =function(_number){
		if(_number>0){
			return false
		}
		if(_number<0){
			return false
		}
		return true
	}

	this.get_camera_coords = function(){

		// camera_peg 
		
		// if the camera has no key the coords are probably at 0 but it's not 100% sure.. need to check this. 
		
		//SEPARATE COORDS
		var SEP_x = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.X"))
		var SEP_y = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.Y"))
		var SEP_z = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.Z"))
		
		//3D COORDS
		var ThreeD_x = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.3DPATH.X"))
		var ThreeD_y = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.3DPATH.Y"))
		var ThreeD_z = S.trees.toonboom_coords_to_float(node.getTextAttr("Top/Camera_Peg", frame.current(), "POSITION.3DPATH.Z"))
		
		var camera_peg = OO.doc.getNodeByPath("Top/Camera_Peg");
		var column3D = S.trees.get_linked_3D_columns(camera_peg)
		var next_3d_key = S.trees.get_next_3Dkey(column3D);
		if(next_3d_key != false){
			ThreeD_x = S.trees.toonboom_coords_to_float(next_3d_key[0]);
			ThreeD_y = S.trees.toonboom_coords_to_float(next_3d_key[1]);
			ThreeD_z = S.trees.toonboom_coords_to_float(next_3d_key[2]);	
		}

		var cam_peg_x = this.is_zero(ThreeD_x) == false ? ThreeD_x : SEP_x
		var cam_peg_y = this.is_zero(ThreeD_y) == false ? ThreeD_y : SEP_y
		var cam_peg_z = this.is_zero(ThreeD_z) == false ? ThreeD_z : SEP_z

		var cam_w = 1920
		var cam_h = 1080

		const camera = {
			x:cam_peg_x,
			y:cam_peg_y,
			z:cam_peg_z,
			cx:parseFloat(cam_w/2),
			cy:parseFloat(cam_h/2),
			w:cam_w,
			h:cam_h
		}

		return camera

	}


	this.calculate_final_coords = function(_camera,_bg,_cadre){

		function safeScale(value) {
			// Convert to number
			value = Number(value);
		
			// If it's NaN, zero, or negative → return 1
			if (!isFinite(value) || value <= 0) return 1;
		
			return value;
		}
		function safePosition(value) {
			// Convert to number
			value = Number(value);
		
			// If it's NaN, zero, or negative → return 1
			if (!isFinite(value)) return 1;
		
			return value;
		}

		var final_ratio = 1

		
		//addtionnal scale ratio based on the camera Z 
		if(_camera.z!=0){

			var calculated_width = this.camera_z_to_width(_camera.z)
			
			S.log.add("[Fit] calculting scale based on ( CAMERA Z ) ")
			S.log.add("[Fit] width : ( "+calculated_width.width+" ) ")
			S.log.add("[Fit] pixel_width : ( "+calculated_width.pixel_width+" ) ")
			S.log.add("[Fit] z ratio : "+calculated_width.pixel_width+" / "+_cadre.w)
			z_ratio = parseFloat(calculated_width.pixel_width/_cadre.w)
			S.log.add("[Fit] Z RATIO : ( "+z_ratio+" ) ")

			//the camera is now "bigger" so we update it's center coords
			_camera.cx = calculated_width.pixel_width/2
			_camera.cy= calculated_width.pixel_height/2
			_camera.w = calculated_width.pixel_width
			_camera.h = calculated_width.pixel_height
			
			final_ratio =z_ratio
		}else{
			
			S.log.add("[Fit]  calculting scale based on ( WIDTH ) " )
			var simple_ratio = parseFloat(_camera.w / _cadre.w);	
			final_ratio = simple_ratio
			S.log.add("[Fit] WIDTH RATIO : ( "+simple_ratio+" ) ")

		}

		//converting top coordonate to center coordonates 
		//distance between bg center and the cadre
		var cadre_distance_to_bg_center= {
			x:(_bg.cx - _cadre.x) * final_ratio,
			y:(_bg.cy - _cadre.y) * final_ratio 
		}

		var cadre_distance_to_cam_center ={
			x:(cadre_distance_to_bg_center.x - (_camera.cx)),
			y:(cadre_distance_to_bg_center.y - (_camera.cy))
		}


		//FINAL SCALE 
		const final_sx = final_ratio != 0 ? final_ratio * this._compensating_factor  : 1 ; // compensating factor is used when reading from json
		const final_sy = final_ratio  != 0 ? final_ratio * this._compensating_factor  : 1 ;
		
		// FINAL POSITIONS
		var RATIO_PIXEL_X = parseFloat(toonboom_half_HD_width/(1920/2))
		var RATIO_PIXEL_Y = parseFloat(toonboom_half_HD_height/(1080/2))


		S.log.add("[PortalFiter]  - RATIO_PIXEL_X = "+RATIO_PIXEL_X,"process");
		S.log.add("[PortalFiter]  - RATIO_PIXEL_Y = "+RATIO_PIXEL_Y,"process");			
		S.log.add("[PortalFiter]  - CAM_X = "+_camera.x,"process");			
		S.log.add("[PortalFiter]  - CAM_Y = "+_camera.y,"process");			
		S.log.add("[PortalFiter]  - CAM_Z = "+_camera.z,"process");			

		const final_x =  parseFloat((cadre_distance_to_cam_center.x * RATIO_PIXEL_X)  + _camera.x);
		const final_y =  parseFloat((-cadre_distance_to_cam_center.y * RATIO_PIXEL_Y) + _camera.y);
		const final_z =  parseFloat(0);
		
		/*
		var coords = {
			x:safePosition(final_x),
			y:safePosition(final_y), 
			z:safePosition(final_z),
			sx:safeScale(final_sx),
			sy:safeScale(final_sy)
		}
		*/
		
		
		var coords = {
			x:final_x,
			y:final_y, 
			z:final_z,
			sx:safeScale(final_sx),
			sy:safeScale(final_sy)
		}
		

		return coords

	}

 
	
	

}

//MessageLog.trace("Class PortalPlacer ");
