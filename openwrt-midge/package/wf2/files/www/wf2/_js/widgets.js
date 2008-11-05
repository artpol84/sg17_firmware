/*
 * Create page element. Page consist of tabs.
 */
function Page(p) {
	/* prefix to tab's id */
	var tabIdPrefix = "tab_";
	
	/* pointer to the first link for a tab */
	var firstTab = null;
	
	/* clear container */
	$(p).empty();
	
	/* array with tabs' info */
	this.tabsInfo = new Array();
	
	/* common for all tabs subsystem and help */
	this.subsystem = null;
	this.helpPage = null;
	
	/* set subsystem common for all tabs */
	this.setSubsystem = function(subsystem) {
		this.subsystem = subsystem;
	};
	
	/* Set help page common for all tabs. Help section is set to the id of tab */
	this.setHelpPage = function(helpPage) {
		this.helpPage = helpPage;
	};
	
	/*
	 * Add tab.
	 * - tab: tab.id — id of the tab;
	 *        tab.name — name of the tab;
	 *        tab.func — function to call to generate tab's content.
	 */
	this.addTab = function(tab) {
		this.tabsInfo.push(tab);
	};
	
	/* generate tabs' links and divs */
	this.generateTabs = function() {
		/* create ul for tabs' links */
		var tabsList = $.create("ul");
		
		/* go through tabs' info */
		$.each(this.tabsInfo, function(num, tab) {
			/* create link to a tab */
			var href = $.create("a",
				{
					"href": "#" + tabIdPrefix + tab['id'],
					"id": tabIdPrefix + tab['id'] + "_link"
				},
				$.create("span", {}, _(tab['name']))
			);
			
			/* add click event */
			href.click(function(e) {
				/*
				 * Clear all tabs (to prevent problems when elements have identical IDs on
				 * different tabs).
				 */
				$(".tabs-container").empty();
				
				/* render tab's content */
				tab['func']();
				
				scrollTo(0, 0);
			});
			
			/* save pointer to the first link for a tab */
			if (!firstTab) firstTab = href;
			
			/* add link to the list */
			$.create('li', {}, href).appendTo(tabsList);
		});
		
		/* add list with links to a page */
		tabsList.appendTo(p);
		
		/* go through tabs' info */
		$.each(this.tabsInfo, function(num, tab) {
			/* create div for a tab */
			$.create('div', {'id': tabIdPrefix + tab['id']}).appendTo(p);
		});
		
		/* update tabs */
		$(p).tabs({"fxAutoHeight": true});
		
		/* render content of the first tab */
		firstTab.click();
	};
	
	/*
	 * Create Container for a tab.
	 * - tabId — ID of tab to create container for.
	 */
	this.addContainer = function(tabId) {
		return new Container($("#" + tabIdPrefix + tabId),
			{"subsystem": this.subsystem, "help": {"page": this.helpPage, "section": tabId}});
	};
	
	/* Add line break to the tab */
	this.addBr = function(tabId) {
		$.create('br').appendTo($('#' + tabIdPrefix + tabId));
	};
	
	this.clearTab = function(tabId) {
		$('#' + tabIdPrefix + tabId).empty();
	};
	
	this.getTab = function(tabId) {
		return $("#" + tabIdPrefix + tabId);
	};
}

/* show HTML page in popup window */
function popup(url) {
	 var width  = 608;
	 var height = 700;
	 var left   = (screen.width - width)/2;
	 var top    = (screen.height - height)/2;
	 var params = 'width='+width+', height='+height;
	 params += ', top='+top+', left='+left;
	 params += ', directories=no';
	 params += ', location=no';
	 params += ', menubar=no';
	 params += ', resizable=no';
	 params += ', scrollbars=1';
	 params += ', status=1';
	 params += ', toolbar=no';
	 newwin = window.open(url,'help', params);
	 if (window.focus) {newwin.focus()}
	 return false;
}

/*
 * Do Ajax request for command execution,
 * replace '\n' in output with '<br>'.
 * If router is online, result is "Router is offline".
 * 
 * cmd — command to execute.
 * dst — destination for command output:
 *  - dst['container'] — set html of container to command's output;
 *  - dst['callback'] — function to call after request. command's output is passed to func as arg.
 *  - dst['sync'] — do sync request and return command's output to calling function.
 * filter — function to filter command's output.
 */
function cmdExecute(cmd, dst, filter) {
	var result = null;
	
	var processResult = function(data) {
		if (dst && dst['container']) {
			$(dst['container']).html(data);
			
			/* workaround for max-height in IE */
			$(dst['container']).minmax();
		} else if (dst && dst['callback']) {
			dst['callback'](data);
		} else if (dst && dst['sync']) {
			result = data;
		}
	};
	
	if (!config.isOnline()) {
		processResult("Router is offline");
		return;
	}
	
	var options = {
		"type": "POST",
		"url": "sh/execute.cgi",
		"dataType": "text",
		"data": {"cmd": cmd},
		"dataFilter": function(data, type) {
			var newData = data.replace(/\n/g, "<br>");
			if (filter) return filter(newData);
			else return newData;
		},
		"success": processResult,
		"error": function() {
			processResult("Connection timeout");
		}
	};
	
	if (dst && dst['sync']) options['async'] = false;
	
	$.ajax(options);
	
	return result;
}

/*
 * Container for widgets.
 * p — parent container.
 * options — container options (subsystem & help), set in Page object.
 * I18N for widgets.
 */
function Container(p, options) {
	/* link to this object */
	var thisContainer = this;
	
	/* set subsystem common for all tabs */
	this.subsystem = options.subsystem;
	
	/* set help page common for all tabs */
	this.help = options.help;
	
	this.ajaxTimeout = null;
	
	/*
	 * Create necessary data structures and page elements.
	 */
	this.initContainer = function(options) {
		if (options && options['clear']) p.empty();
		
		this.validator_rules = new Object();
		this.validator_messages = new Object();
		
		/* create div for info or error messages */
		this.infoMessage = "info_message_" + p.attr("id");
		if ($("#" + this.infoMessage).length == 0) {
			$.create("div", {"className": "message", "id": this.infoMessage}).appendTo(p);
		}
		
		this.form = $.create("form", {"action": ""}).appendTo(p);
		this.table = $.create("table",
			{"id": "conttable", "cellpadding": "0", "cellspacing": "0", "border": "0"}).appendTo(this.form);
		this.table.append($.create("thead"));
	};
	
	/* init container */
	this.initContainer();

	/* set subsystem for this tab */
	this.setSubsystem = function(subsystem) {
		this.subsystem = subsystem;
	};
	
	/* set help page for this tab */
	this.setHelpPage = function(helpPage) {
		this.help['page'] = helpPage;
	};
	
	/* set subsystem for this tab */
	this.setHelpSection = function(helpSection) {
		this.help['section'] = helpSection;
	};
	
	/*
	 * Set time in seconds to wait for server reply before show an error message.
	 */
	this.setAjaxTimeout = function(timeout)  {
		this.ajaxTimeout = timeout * 1000;
	};
	
	/* 
	 * Adds title and context help link to container and adds it to container's table.
	 * 
	 * title — I18N title.
	 * colspan — number of cols to span for title cell.
	 */
	this.addTitle = function(title, colspan) {
		var url = null;
		
		/* create url for context help */
		if (this.help['page'] && this.help['section']) {
			url = "/help/" + this.help['page'] + ".html#" + this.help['section'];
		} else if (this.help['page']) {
			url = "/help/" + this.help['page'] + ".html";
		}
		
		/* if url is set — create context help link object, otherwise set it to null */
		var help = url ? $.create('a', {'href': '#', 'className': 'helpLink'}, '[?]')
			.click(function() {
				popup(url);
			}) : null;
		
		/* create table's row for title and context help link */
		$("thead", this.table).append(
			$.create("tr", {},
				$.create("th", {"colSpan": colspan ? colspan : "2"},
					[
						_(title),
						" ",
						help
					]
				)
			)
		);
	};
	
	/*
	 * Create general data for all widgets elements.
	 * w — widget's info.
	 * p — destination container.
	 * I18N for text and description.
	 */
	this.createGeneralWidget = function(w) {
		/* if this field is required — show "*" */
		var required = (w.validator && w.validator['required']) ? " *" : "";
	
		/* if description is specified — show it */
		var tdElements;
		if (w.descr) {
			tdElements = new Array();
			tdElements.push($.create('br'));
			tdElements.push($.create('p', {}, _(w.descr)));
		}
		
		/* create table row for widget */
		var tr = $.create('tr', {}, [
				$.create('td', {'className': 'tdleft'}, _(w.text) + required),
				$.create('td', {'id': 'td_' + w.name}, tdElements)
			]
		);
		
		return tr;
	};
	
	/*
	 * Create text widget.
	 * I18N for tip.
	 */
	this.createTextWidget = function(w, value) {
		var attrs = {
			"type": "text",
			"name": w.name
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		
		/* set KDB value */
		if (value) {
			attrs['value'] = value;
		/* if KDB value does't exists — set default value, if it exists */
		} else if (w.defaultValue != undefined) {
			attrs['value'] = w.defaultValue;
		}
		
		return $.create('input', attrs);
	};
	
	/*
	 * Create password widget.
	 * I18N for tip.
	 */
	this.createPasswordWidget = function(w) {
		var attrs = {
			"type": "password",
			"name": w.name
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		
		return $.create('input', attrs);
	};
	
	/*
	 * Create checkbox widget.
	 * I18N for tip.
	 */
	this.createCheckboxWidget = function(w, value) {
		var attrs = {
			"type": "checkbox",
			"name": w.name,
			"className": "check",
			"value": "1"
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		if (value == "1" || value == "on") attrs['checked'] = true;
		
		return $.create('input', attrs);
	};
	
	/*
	 * Create select widget.
	 * I18N for tip.
	 */
	this.createSelectWidget = function(w) {
		var attrs = {'name': w.name};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		
		return $.create('select', attrs);
	};
	
	/*
	 * Add HTML text.
	 * 
	 * w.dataFilter — may be used with w.cmd — function to filter command output data.
	 */
	this.createHtmlWidget = function(w, value) {
		var attrs = {"className": "htmlWidget"};
		w.tip && (attrs['title'] = _(w.tip));
		
		var span = $.create("span", attrs);
		if (w.kdb) {
			$(span).html(value);
		} else if (w.cmd) {
			$(span).html("Loading...");
			if (w.dataFilter) cmdExecute(w.cmd, {"container": span}, w.dataFilter);
			else cmdExecute(w.cmd, {"container": span});
		} else if (w.str) {
			$(span).html(w.str);
		}
		
		return span;
	};

	/*
	 * Create hidden widget.
	 */
	this.createHiddenWidget = function(w, value) {
		var attrs = {
			"type": "hidden",
			"name": w.name
		};
		w.id && (attrs['id'] = w.id);
		
		/* set KDB value */
		if (value) {
			attrs['value'] = value;
		/* if KDB value does't exists — set default value, if it exists */
		} else if (w.defaultValue != undefined) {
			attrs['value'] = w.defaultValue;
		}
		
		return $.create("input", attrs);
	};
	
	/*
	 * Create file widget.
	 */
	this.createFileWidget = function(w) {
		var attrs = {
			"type": "file",
			"name": w['name']
		};
		w['id'] && (attrs['id'] = w['id']);
		
		return $.create("input", attrs);
	};

	/*
	 * Add complete widget (table's TR) to container.
	 * 
	 * w — widget to add.
	 * insertAfter — if specified, insert new widget after this element.
	 */
	this.addWidget = function(w, insertAfter) {
		if (w['type'] != "hidden") {
			/* add common widget's data. insert after specified widget, otherwise insert last */
			if (insertAfter) this.createGeneralWidget(w).insertAfter(insertAfter);
			else this.createGeneralWidget(w).appendTo(this.table);
		}
		
		this.addSubWidget(w);
	};
	
	/*
	 * Add subwidget (input, select, etc) to complete widget or to specified element.
	 * w — widget to add.
	 * insertAfter — if specified, insert new subwidget after this element (just plain element).
	 * 
	 * return added widget.
	 */
	this.addSubWidget = function(w, insertAfter) {
		/* get field's value */
		var value;
		
		/* TODO: make full support for cookies (do not write it to KDB but save in cookie) */
		if (w['cookie']) value = $.cookie(w['name']);
		else value = w.item ? config.getParsed(w.item)[w.name] : config.get(w.name);
		
		var widget;
		switch (w.type) {
			case "text": 
				widget = this.createTextWidget(w, value);
				break;
			case "hidden":
				widget = this.createHiddenWidget(w, value);
				break;
			case "password": 
				widget = this.createPasswordWidget(w);
				break;
			case "checkbox":
				widget = this.createCheckboxWidget(w, value);
				break;
			case "html":
				widget = this.createHtmlWidget(w, value);
				break;
			case "file":
				widget = this.createFileWidget(w);
				break;
			case "select":
				widget = this.createSelectWidget(w);
				if (w.options) {
					widget.setOptionsForSelect(w.options,
						value, w.defaultValue);
				}
				break;
		}
		
		/* insert new subwidget at specified position or just in form for hidden widget */
		if (w['type'] == "hidden") this.form.append(widget);
		else if (insertAfter) widget.insertAfter(insertAfter);
		else $("#td_" + w.name, this.form).prepend(widget);
		
		/* set nice tooltip */
		widget.tooltip({"track": true});
		
		/* bind specified events */
		this.bindEvents(w);
		
		w.validator && (this.validator_rules[w.name] = w.validator);
		
		/* I18N for element's error messages */
		w.message && (this.validator_messages[w.name] = _(w.message));
		
		return widget;
	};
	
	/*
	 * Bind events to widget.
	 * If w['eventHandlerObject'] is set, then pass it as parameter to event handler,
	 * otherwise pass current container.
	 */
	this.bindEvents = function(w) {
		if (w['onChange']) {
			$("#" + w['id']).change(function() {
				if (w['eventHandlerObject']) w['onChange'](w['eventHandlerObject']);
				else w['onChange'](thisContainer);
			});
		}
		
		if (w['onClick']) {
			$("#" + w['id']).click(function() {
				if (w['eventHandlerObject']) w['onClick'](w['eventHandlerObject']);
				else w['onClick'](thisContainer);
			});
		}
	};

	/* 
	 * Sets error message.
	 * I18N for text.
	 */
	this.setError = function(text) {
		var idInfoMessage = "#" + this.infoMessage;
		$(idInfoMessage).html(_(text));
		$(idInfoMessage).removeClass("success_message");
		$(idInfoMessage).addClass("error_message");
	};
	
	/* 
	 * Sets info message.
	 * I18N for text.
	 */
	this.setInfo = function(text) {
		var idInfoMessage = "#" + this.infoMessage;
		$(idInfoMessage).html(_(text));
		$(idInfoMessage).removeClass("error_message");
		$(idInfoMessage).addClass("success_message");
	};

	/*
	 * Adds submit button, form validation rules and submit's events handlers.
	 * 
	 * options['reload'] — reload page after AJAX request (e.g., for update translation);
	 * options['onSuccess'] — callback on request successfully completion;
	 * options['noSubmit'] — do not submit the form, but call onSubmit and preSubmit callbacks;
	 * options['onSubmit'] — callback on submit event to call after submitting the form;
	 * options['preSubmit'] — callback on submit event to call before submitting the form.
	 */
	this.addSubmit = function(options) {
		var idInfoMessage = "#" + this.infoMessage;
		var timeout = this.ajaxTimeout;
		var outer = this;
		
		/* shows message */
		var showMsg = function() {
			$(idInfoMessage).show();
		};

		/* if subsystem is set — add it to the form */
		if (this.subsystem) {
			this.form.append(
				$.create("input",
					{"type": "hidden", "name": "subsystem", "id": "subsystem", "value": this.subsystem}
				)
			);
		}

		/* create submit button */
		$.create("input", {
			"type": "submit",
			"className": "button",
			"value": options && options.submitName ? _(options.submitName) : _("Save")
		}).appendTo(this.form);
		
		if (options && options.extraButton) {
			var button = $.create("input", {
				"type": "button",
				"value": _(options.extraButton.name)
			}).appendTo(this.form);
			button.click(options.extraButton.func);
		}
		
		/* options for form validation */
		var validateOptions = {
			"rules": this.validator_rules,
			"messages": this.validator_messages,
			
			/* container where to show error */
			"errorContainer": idInfoMessage,
			
			/* Set error text to container */
			"showErrors": function(errorMap, errorList) {
				outer.setError("Please, enter a valid data into the form below to be able to save it successfully.");
				this.defaultShowErrors();
			},
     		
     		/* on submit event */
     		"submitHandler": function(form) {
     			/* if noSubmit is set — do not submit the form */
     			if (options && options['noSubmit']) {
     				if (options['onSubmit']) options['onSubmit']();
     				if (options['preSubmit']) options['preSubmit']();
     				return;
     			}
     			
     			/* call user function on submit event before submitting form */
     			if (options && options['preSubmit']) options['preSubmit']();
     			
     			/* remove alert text */
				$(".alertText", form).remove();
				
				/* remove class indicating field updation */
				$("*", form).removeClass("fieldUpdated");
		
     			/*
     			 * All checkboxes return values, even they are unchecked.
     			 * Here we find all unchecked checkboxes, temporarily check them, set
     			 * their value, and set their class to doUncheck, to uncheck them later.
     			 */
     			$(":checkbox").not(":checked").each(function() {
					this.checked = true;
					this.value = 0;
				}).addClass("doUncheck");
				
				var reload = (options && options.reload) ? true : false;
				var onSuccess = (options && options.onSuccess) ? options.onSuccess : false;
				
				/* array with fields for saving */
				var fields;
				
				/*
				 * complexValue is name of variable, which value consist of other variables
				 * (e.g., complexValue is sys_voip_route_15, and it's value will be
				 * "enabled=1 router_id=135")
				 */
				if (options && options.complexValue) {
					var bigValue = "";
					var subsystem;
					/* go through form's fields and create complex value */
					$.each($(form).formToArray(), function(num, field) {
						/* write subsystem in separate variable */
						if (field['name'] == "subsystem") subsystem = field['value'];
						/* add variable and it's value to complex value */
						else bigValue += field['name'] + "=" + field['value'] + " ";
					});
					bigValue = $.trim(bigValue);

					/* create array for fields */
					fields = new Array();
					
					/* add complex value */
					fields.push({
						"name": options.complexValue,
						"value": bigValue
					});
					
					/* if subsystem is set, add it to array with fields */
					if (subsystem) {
						fields.push({
							"name": "subsystem",
							"value": subsystem
						});
					}
				/* if we are not in need of complex value, create array with form's fields */
				} else {
					fields = $(form).formToArray();
				}
				
				/* submit task (updating settings) for execution */
     			config.kdbSubmit(fields, timeout, reload, onSuccess);
				
				/* set checkboxes to their original state */
				$(".doUncheck").each(function() {
					this.checked = false;
					this.value = 1;
				}).removeClass("doUncheck");
				
				/* call user function on submit event */
     			if (options && options['onSubmit']) options['onSubmit']();
     		}
		};
		
		/* if widgets are placed in a table */
		if (this.isTable) {
			/* show errors for fields in the error's container above table */
			validateOptions['errorLabelContainer'] = idInfoMessage;
     		
     		/* wrap errors in "li" elements */
     		validateOptions['wrapper'] = "li"
		} else {
			validateOptions['errorPlacement'] = function(error, element) {
     			error.prependTo(element.parent());
     		}
		}
		
		/* apply validate rules to form */
		$(this.form).validate(validateOptions);
	};
	
	/*
	 * Submit form in traditional way, without AJAX.
	 * 
	 * options['submitName'] — name of button for submitting;
	 * options['formAction'] — action for the form;
	 * options['encType'] — enctype property for the form.
	 */
	this.addSubmitNoAjax = function(options) {
		if (options && options['formAction']) this.form.attr("action", "/cfg.cgi");
		if (options && options['method']) this.form.attr("method", "post");
		if (options && options['encType']) {
			this.form.attr("enctype", "multipart/form-data");
			
			/* IE fix */
			this.form.attr("encoding", "multipart/form-data");
		}
		
		/* create submit button */
		$.create("input", {
			"type": "submit",
			"className": "button",
			"value": options && options['submitName'] ? _(options['submitName']) : _("Save")
		}).appendTo(this.form);
	};
	
	/*
	 * Creates and returns command header and output's body.
	 */
	this.createCmdTitleAndBody = function(cmd) {
		var result = 
			[
				$.create("b", {}, cmd),
				$.create("br"),
				$.create("div", {"className": "pre scrollable"}, _("Loading..."))
			];
		return result;
	};
	
	/*
	 * Adds HTML code for command output to table.
	 */
	this.addConsoleHTML = function(cmd, p) {
		$.create("tr", {},
			$.create("td", {}, this.createCmdTitleAndBody(cmd))
		).appendTo(p);
	};
	
	/*
	 * Add output of command execution to the page.
	 * cmd — string or array with cmds' to execute.
	 */
	this.addConsole = function(cmd) {
		var outer = this;
		
		/* adds command's HTML to the page, and makes AJAX request to the server */
		var addConsoleOut = function(num, cmd) {
			outer.addConsoleHTML(cmd, outer.table);
			cmdExecute(cmd, {"container": $("tr > td > b:contains('" + cmd + "')", outer.table).nextAll("div.pre")});
		};
		
		/* we can have one or several commands */
		if (typeof cmd == "object") {
			$(cmd).each(function(num, cmd) {
				addConsoleOut(num, cmd);
			});
		} else {
			addConsoleOut(0, cmd);
		}
	};
	
	/*
	 * Create div in the form and add console output to it.
	 * 
	 * cmd — command to execute.
	 */
	this.addConsoleToForm = function(cmd) {
		/* create div for command output */
		var div = $.create("div", {"className": "pre, cmdOutput"}, _("Loading...")).appendTo(this.form);
		
		cmdExecute(cmd, {"container": div});
	};
	
	/*
	 * Run command with specified parameters.
	 * First argument — command template (e.g., "/bin/ping -c %ARG %ARG").
	 * Next arguments — name of form's fields to pass as command arguments.
	 * E.g.: addRun("/bin/ping -c %ARG %ARG", "count", "host");
	 */
	this.addRun = function() {
		/* create submit button */
		$.create("input", {"type": "submit", "className": "button", "value": _("Run")}).appendTo(this.form);
		
		/* create div for command output */
		var cmdOutput = $.create("div").appendTo(this.form);
		
		var runArgs = arguments;
		var outer = this;
		$(this.form).submit(function() {
			var cmd;
			
			/* make from command template real command */
			$.each(runArgs, function(num, name) {
				if (num == 0) {
					cmd = name;
					return true;
				}
				var value = $("input[name=" + name + "]").val();
				cmd = cmd.replace("%ARG", value);
			});

			/* clear div for command output */
			cmdOutput.empty();
			
			/* add command header and body to div */
			$.each(outer.createCmdTitleAndBody(cmd), function(num, element) {
				element.appendTo(cmdOutput);
			});
			
			/* execute command */
			cmdExecute(cmd, {"container": $("div.pre", cmdOutput)});
			
			/* prevent form submission */
			return false;
		});
	};
	
	/*
	 * Add button which executes console command.
	 * 
	 * name — I18N name of button.
	 * cmd — command to execute.
	 */
	this.addAction = function(name, cmd) {
		/* create submit button */
		$.create('input', {'type': 'submit', 'className': 'button', 'value': _(name)}).appendTo(this.form);
		
		$(this.form).submit(function() {
			/* execute command */
			cmdExecute(cmd);
			return false;
		});
	};
	
	/*
	 * Add header for table.
	 * 
	 * header — separated with "|" list of table column's header.
	 * addFunc ­— function to call for rendering page for adding new element to table.
	 */
	this.addTableHeader = function(header, addFunc) {
		/* set table flag (for validation) */
		this.isTable = true;
		
		var tr = $.create("tr", {"align": "center", "className": "tableHeader"});
		$.each(header.split("|"), function(num, value) {
			$.create("th", {}, _(value)).appendTo(tr);
		});
		
		/* add button for adding new elements */
		if (addFunc) {
			/* create "button" for adding */
			var img = $.create("img", {"src": "_img/plus.gif", "alt": "add"});
			img.click(function(e) {
				addFunc();
				scrollTo(0, 0);
			});
			
			/* change image when mouse is over it */
			img.hover(
				function() {
					$(this).attr("src", "_img/plus2.gif")
				},
				function() {
					$(this).attr("src", "_img/plus.gif")
				}
			);
			
			/* we use colSpan because future rows will contain buttons for editing and deleting */
			$.create("th", {"colSpan": "2"}, img).appendTo(tr);
		}
		
		/* add to thead section of current table */
		$("thead", this.table).append(tr);
	};
	
	/*
	 * Add text to tfoot section in the table.
	 * I18N for str.
	 * 
	 * str — text to add;
	 * colspan — number of columns to span for tfoot's row.
	 */
	this.addTableTfootStr = function(str, colspan) {
		if ($("tfoot", this.table).length == 0) $("thead", this.table).after($.create("tfoot"));
		$("tfoot", this.table).append($.create("tr", {}, $.create("td", {"colSpan": colspan}, _(str))));
	};
	
	/* Adds row to the table */
	this.addTableRow = function() {
		return $.create("tr", {"align": "center"}).appendTo(this.table);
	};
	
	/*
	 * Adds table's cell with proper id.
	 * 
	 * w — widget.
	 * row — destination row.
	 */
	this.addGeneralTableWidget = function(w, row) {
		$.create("td", {"id": "td_" + w.name}).appendTo(row);
	};
	
	/*
	 * Add widget to table.
	 * 
	 * w — widget.
	 * row — destination row.
	 */
	this.addTableWidget = function(w, row) {
		this.addGeneralTableWidget(w, row);
		
		/* add subwidget and style it */
		this.addSubWidget(w).addClass("table");		
	};
	
	/*
	 * Adds list to a container "c". It gets list values from KDB
	 * by key "listItem*", renders list title, creates function to
	 * add and delete new elements. After adding or deleting
	 * element, it redraws the page by calling click() event on
	 * tab link.
	 * 
	 * c — container to add list to;
	 * options — object with options:
	 *  - tabId — id of tab this list is added to (is used for search tab link);
	 *  - header — array with columns' headers of the list (I18N);
	 *  - varList — array with variables' names;
	 *  - listItem — template of name for list item (e.g., sys_voip_route_);
	 *  - listTitle — title for the list (I18N);
	 * 
	 *  optional parameters:
	 *  - processValueFunc — optional callback, which can be used for editing values of item's
	 *     variable. It is called for each item' variable with two parameters — name of variable
	 *     and variable's value. It have to return variable's value.
	 *  - onAddOrEditItemRender — optional callback, which is called when page for adding or
	 *     editing list's elements is rendered. It is called with one parameter — this list.
	 *  - helpPage — help page;
	 *  - helpSection — help section;
	 *  - subsystem — subsystem;
	 *  - addMessage — title for add page (I18N);
	 *  - editMessage — title for edit page (I18N).
	 */
	var List = function(c, options) {
		var list = this;
		
		/* array with widgets for add/edit page */
		var widgets = new Array();
		
		/* redraw page after adding/editing list item */
		var showPage = function() {
			$($.sprintf("#tab_%s_link", options['tabId'])).click();
		};
		
		/* 
		 * Add/edit item.
		 * 
		 * item — if this parameter is set, then edit this item.
		 */
		var addOrEditItem = function(item) {
			/* clear this container */
			c.initContainer({"clear": true});

			if (options['helpPage']) c.setHelpPage(options['helpPage']);
			if (options['helpSection']) c.setHelpSection(options['helpSection']);
			if (options['subsystem']) c.setSubsystem(options['subsystem']);

			/* decide, if we will add or edit item */
			if (!item) {
				c.addTitle(options['addMessage'] || "Add");
				values = config.getParsed(options['listItem'] + "*");
				item = options['listItem'] + $.len(values);
			} else c.addTitle(options['editMessage'] || "Edit");
			
			/* set calculated item in options object for later use in dynamic widgets */
			options['currentItem'] = item;

			/* add widgets */
			$.each(widgets, function(num, widget) {
				/* item property is used for properly get the value of a widget */
				widget['widget']['item'] = item;
				
				c.addWidget(widget['widget'], widget['insertAfter']);
			});
			
			/* add submit (with special for list options) */
			c.addSubmit({
				"complexValue": item,
				"submitName": "Add/Update",
				"extraButton": {
					"name": "Back",
					"func": showPage
				},
				"onSubmit": showPage
			});
			
			/* if set callback on render event, call it with this object as a parameter */
			if (options['onAddOrEditItemRender']) options['onAddOrEditItemRender'](list);
		};
		
		/* add list header */
		var addListHeader = function() {
			var tr = $.create("tr", {"align": "center", "className": "tableHeader"});
			
			/* add columns headers */
			var thNum = 0;
			$.each(options['header'], function(num, value) {
				$.create("th", {}, _(value)).appendTo(tr);
				thNum++;
			});
			
			/* add list header with colSpan parameter */
			c.addTitle(options['listTitle'], thNum + 2);
			
			/* create "button" for adding */
			var img = $.create("img", {"src": "_img/plus.gif", "alt": "add"});
			img.click(function(e) {
				addOrEditItem();
				scrollTo(0, 0);
			});
			
			/* change image when mouse is over it */
			img.hover(
				function() {
					$(this).attr("src", "_img/plus2.gif")
				},
				function() {
					$(this).attr("src", "_img/plus.gif")
				}
			);
			
			/* we use colSpan because future rows will contain buttons for editing and deleting */
			$.create("th", {"colSpan": "2"}, img).appendTo(tr);
			
			/* add to thead section of current table */
			$("thead", c.table).append(tr);
		};
		
		/*
		 * Confirm item deletion.
		 * 
		 * item — item to delete.
		 */
		var deleteConfirm = function(item) {
			/* find div for showing delete confirm message  */
			var msgDiv = $("div.error_message", c.form);
			
			msgDiv.html(_("Are you sure you want to delete this item?<br>"));
			
			/* create Yes button */
			var button = $.create("input", {
				"type": "button",
				"className": "button",
				"value": _("Yes")
			}).appendTo(msgDiv);
			
			/* delete item */
			button.click(function() {
				msgDiv.hide();
				$(".selected", c.table).removeClass("selected");
				
				/* delete item and restart subsystem */
				config.kdbDelListKey(item, c.subsystem, c.ajaxTimeout);
				
				/* call func after deleting (updates page) */
				showPage();
			});
			
			/* create No button */
			button = $.create("input", {
				"type": "button",
				"value": _("No")
			}).appendTo(msgDiv);
			
			/* cancel delete */
			button.click(function() {
				msgDiv.hide();
				$(".selected", c.table).removeClass("selected");
			});
	
			msgDiv.show();
		};
		
		/*
		 * Add widget to add/edit page.
		 */
		this.addWidget = function(w, insertAfter) {
			/* save link to this object to use later in events' handlers */
			w['eventHandlerObject'] = list;
			
			widgets.push({"widget": w, "insertAfter": insertAfter});
		};
		
		/*
		 * Add widget to add/edit page after it generation (e.g., in event's handler).
		 */
		this.addDynamicWidget = function(w, insertAfter) {
			/* save link to this object to use later in events' handlers */
			w['eventHandlerObject'] = list;
			
			w['item'] = options['currentItem'];
			c.addWidget(w, insertAfter);
		};
		
		/*
		 * Generate list.
		 */
		this.generateList = function() {
			/* add list header */
			addListHeader();
			
			/* get list of items */
			var items = config.getParsed(options['listItem'] + "*");
			
			/* go through item's list */
			$.each(items, function(key, value) {
				var row = c.addTableRow();
				var cssClass = new Object();
				
				/* change text color for disabled items */
				if (value['enabled'] == "off" || value['enabled'] == "0") {
					cssClass['className'] = "disabled";
				}
				
				/* for each variable in item's value create table cell with variable's value */
				$.each(options['varList'], function(num, variable) {
					var finalVal = options['processValueFunc'] ?
						options['processValueFunc'](variable, value[variable]) : value[variable];
					var td = $.create("td", cssClass, finalVal ? finalVal : "&nbsp;")
						.appendTo(row);
				});
				
				/* create "button" for editing */
				var img = $.create("img", {"src": "_img/e.gif", "alt": "edit"});
				img.click(function(e) {
					addOrEditItem(key);
					scrollTo(0, 0);
				});
				
				/* change image when mouse is over it */
				img.hover(
					function() {
						$(this).attr("src", "_img/e2.gif")
					},
					function() {
						$(this).attr("src", "_img/e.gif")
					}
				);
				$.create("td", {}, img).appendTo(row);
				
				/* create "button" for deleting */
				img = $.create("img", {"src": "_img/minus.gif", "alt": "delete"});
				img.click(function(e) {
					/* unhilight previous selected item */
					$(".selected", c.table).removeClass("selected");
					
					/* highlight selected item */
					$(this).parents("tr").addClass("selected");
					
					/* confirm for deleting */
					deleteConfirm(key);
				});
				
				/* change image when mouse is over it */
				img.hover(
					function() {
						$(this).attr("src", "_img/minus2.gif")
					},
					function() {
						$(this).attr("src", "_img/minus.gif")
					}
				);
				$.create("td", {}, img).appendTo(row);
			});
			
			/* create scrollable div */
			var div = $.create("div", {"className": "scrollable"});
	
			/* add current table to scrollable div */
			c.table.wrap(div);
			
			/* rendering of table takes a long time, set timeout and call minmax() to fix IE */
			setTimeout(function(){ $("div.scrollable", c.form).minmax(); }, 50);
			
			/* add div for showing delete confirm message */
			c.form.prepend($.create("div", {"className": "message error_message"}));
		};
	};
	
	/*
	 * Returns new object for creating list.
	 * 
	 * options — list options.
	 */
	this.createList = function(options) {
		return new List(this, options);
	};
}

/*
 * Adds a new item to the menu.
 * path — place for a new item (e.g., "Network:Interfaces" means menu Network, submenu Interfaces).
 * name — name of the menu item.
 * func — name of the function in a Controllers object to call when user clicks on the menu item.
 * params — function parameters.
 * 
 * Example of the menu structure is given below.
 * <ul class="treeview" id="menu">
 *		<li><span>System</span>
 *			<ul>
 *				<li><span><a href="#" onclick="Controllers.webface()">Interface</a></span></li>
 *				<li><span><a href="#" onclick="Controllers.general()">General</a></span></li>
 *			</ul>
 *		</li>
 *		<li><span>Network</span>
 *		    <ul>
 *		        <li><span>Interfaces</span>
 *					<ul>
 *						<li><span><a href="#" onclick="Controllers.iface('eth0')">eth0</a></span></li>
 *						<li><span><a href="#" onclick="Controllers.iface('eth1')">eth1</a></span></li>
 *					</ul>
 *				</li>
 *			</ul>
 *		</li>
 *	</ul>
 */
function addItem(path, name, func, params) {
	/* menu element */
	var idMenu = "#menu";
	
	/* context which is set when menu functions are called */
	var defaultContext = Controllers;
	
	var curLevel = idMenu;
	var pathElems = path.split(":");
	for (var pathElem in pathElems) {
		/* check if the corresponding submenu is exist */
		if ($(" > li > span:contains('" + _(pathElems[pathElem]) + "')", curLevel).length == 0) {
			/* if not, add it */
			$(curLevel).append("<li><span>" + _(pathElems[pathElem]) + "</span><ul></ul></li>");
		}
		/* change current level in the menu */
		curLevel = $(" > li > span:contains('" + _(pathElems[pathElem]) + "')", curLevel).next();
	}
	
	/* create link object */
	var link = $.create('a', {}, _(name))
		.click(function() {
			if (params) defaultContext[func].apply(defaultContext, params);
			else defaultContext[func]();
			
			/* highlight selected item */
			$("a", idMenu).removeClass("clicked");
			$(this).addClass("clicked");
		});
	
	/* create menu item and add it to the menu */
	$.create('li', {}, $.create('span', {}, link)).appendTo(curLevel);
}

/*
 * Update specified fields:
 * update our local KDB, and if value of field was changed — update field and alert user
 * by appending text to field name.
 * ! Field must have ID identical to it's name !
 * 
 * fields — name (or array with names) of field to update.
 * showAlertText — if field was updated — add message.
 */
function updateFields(fields, showAlertText) {
	var oldValues = new Object();
	
	/* convert single field to array */
	if (typeof fields == "string") {
		var field = fields;
		fields = new Array();
		fields.push(field);
	}
	
	/* save old values of fields */
	$.each(fields, function(num, field) {
		oldValues[field] = config.get(field);
	});
	
	/* update local KDB */
	config.updateValues(fields);
	
	/* check if fields was updated */
	$.each(fields, function(num, field) {
		if (oldValues[field] != config.get(field)) {
			/* set new value */
			$("#" + field).val(config.get(field));
			
			/* set class */
			$("#" + field).addClass("fieldUpdated");
			
			/* add info text to field name */
			if (showAlertText) {
				var widgetText = $("#" + field).parents("tr").children(".tdleft");
				var alertText = $.create("span", {"style": "color: red", "className": "alertText"}, " updated");
				widgetText.append(alertText);
			}
		}
	});
}
