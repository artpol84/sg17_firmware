Controllers['multiplexing'] = function() {
	var page = this.Page();
	page.setHelpPage("multiplexing");
	page.setSubsystem("mux");
	
	page.addTab({
		"id": "multiplexing",
		"name": "Multiplexing",
		"func": function() {
			var c, field, id;
			c = page.addContainer("multiplexing");
			c.addTitle("Multiplexing", 10);
			
			c.addTableHeader("DEV|MXEN|CLKM|CLKAB|CLKR|RLINE|TLINE|RFS|TFS|MXSMAP/MXRATE");
			
			/* enables/disables CLKR field depending on CLKM value */
			var onMuxChange = function(iface) {				
				if ($($.sprintf("#sys_mux_%s_clkm", iface)).val() == "0") {
					$($.sprintf("#sys_mux_%s_clkr", iface)).attr("readonly", true);
				} else {
					$($.sprintf("#sys_mux_%s_clkr", iface)).removeAttr("readonly");
				}
			};
			
			$.each(config.getParsed("sys_mux_ifaces"), function(num, iface) {
				var row = c.addTableRow();
				
				field = {
					"type": "html",
					"name": iface,
					"str": iface
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "checkbox",
					"name": $.sprintf("sys_mux_%s_mxen", iface),
					"id": $.sprintf("sys_mux_%s_mxen", iface),
					"tip": "Enable multiplexing on this interface"
				};
				c.addTableWidget(field, row);
				
				id = $.sprintf("sys_mux_%s_clkm", iface);
				field = { 
					"type": "select",
					"name": id,
					"id": id,
					"options": {"0": "clock-slave", "1": "clock-master"},
					"tip": "Select interface mode: <i>clock-master</i> or <i>clock-slave</i>",
					"onChange": function() {
						onMuxChange(iface);
					}
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "select",
					"name": $.sprintf("sys_mux_%s_clkab", iface),
					"options": {"0": "A", "1": "B"},
					"tip": "Select interface clock domain: <i>A</i> or <i>B</i>"
				};
				c.addTableWidget(field, row);
				
				id = $.sprintf("sys_mux_%s_clkr", iface);
				field = { 
					"type": "select",
					"name": id,
					"id": id,
					"options": {"0": "local", "1": "remote"},
					"tip": "Select clock source: <i>remote</i> or <i>local</i> (for <i>clock-master</i> interface only)"
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "text",
					"name": $.sprintf("sys_mux_%s_rline", iface),
					"defaultValue": "0",
					"tip": "Enter rline number (<i>0-15</i>)",
					"validator": {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface),
						"min": 0, "max": 15}
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "text",
					"name": $.sprintf("sys_mux_%s_tline", iface),
					"defaultValue": "0",
					"tip": "Enter tline number (<i>0-15</i>)",
					"validator": {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface),
						"min": 0, "max": 15}
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "text",
					"name": $.sprintf("sys_mux_%s_rfs", iface),
					"defaultValue": "0",
					"tip": "Enter recieve frame start number (<i>0-255</i>)",
					"validator": {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface),
						"min": 0, "max": 255}
				};
				c.addTableWidget(field, row);
				
				field = { 
					"type": "text",
					"name": $.sprintf("sys_mux_%s_tfs", iface),
					"defaultValue": "0",
					"tip": "Enter transmit frame start number (<i>0-255</i>)",
					"validator": {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface),
						"min": 0, "max": 255}
				};
				c.addTableWidget(field, row);
				
				var rate;
				var tip;
				var validator;
				if (iface.search("E1") != -1) {
					rate = "mxsmap";
					tip = "Enter <i>mxsmap</i> for E1 interface. <i>mxsmap</i> is a map of time-slots (e.g., <i>1-31</i>). This value can be changed after saving.";
					validator = {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface), "smap": true};
				} else {
					rate = "mxrate";
					tip = "Enter <i>mxrate</i> for DSL interface. <i>mxrate</i> is a number of time-slots (e.g., <i>12</i>).";
					validator = {"required": $.sprintf("#sys_mux_%s_mxen:checked", iface), "min": 0};
				}
				
				id = $.sprintf("sys_mux_%s_%s", iface, rate);
				field = { 
					"type": "text",
					"name": id,
					"id": id,
					"defaultValue": "0",
					"tip": tip,
					"validator": validator
				};
				c.addTableWidget(field, row);
				
				onMuxChange(iface);
			});
			
			c.addSubmit({
				"onSubmit": function() {
					/* remove previous output */
					$(".cmdOutput").remove();
				},
				"onSuccess": function() {
					/* MXSMAP can be cnanged by system */
					var fields = new Array();
					$.each(config.getParsed("sys_mux_ifaces"), function(num, iface) {
						if (iface.search("E1") != -1) {
							fields.push($.sprintf("sys_mux_%s_mxsmap", iface));
						}
					});
					updateFields(fields);
					
					/* execute command */
					c.addConsoleToForm("/sbin/mxconfig --check");
				}
			});

			c.addConsoleToForm("/sbin/mxconfig --check");
		}
	});
	
	page.generateTabs();
};
