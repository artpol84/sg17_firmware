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
	this.help = null;
	
	/* set subsystem */
	this.setSubsystem = function(subsystem) {
		this.subsystem = subsystem;
	};
	
	/* set help */
	this.setHelp = function(help) {
		this.help = help;
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
		var tabsList = $.create('ul');
		
		/* go through tabs' info */
		$.each(this.tabsInfo, function(num, tab) {
			/* create link to a tab */
			var href = $.create('a', {'href': '#' + tabIdPrefix + tab['id']},
				$.create('span', {}, _(tab['name']))
			);
			
			/* add click event */
			href.click(function(e) {
				/* clear container */
				$('#' + tabIdPrefix + tab['id']).empty();
				
				/* render tab's content */
				tab['func']();
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
		$(p).tabs({fxAutoHeight: true});
		
		/* render content of the first tab */
		firstTab.click();
	};
	
	/*
	 * Create Container for a tab.
	 * - tabId — ID of tab to create container for;
	 * - help: if string, then this is a name of the section (e.g., "logging");
	 * 		   if object, then - help.page: html page name;
	 * 						   - help.section: section name
	 * 			(e.g, {page: "logging", section: "asd"})
	 * 		   if not specified — section is set to tabId.
	 */
	this.addContainer = function(tabId, help) {
		return new Container($('#' + tabIdPrefix + tabId),
			{'subsystem': this.subsystem, 'help': this.help}, help ? help : tabId);
	};
	
	/* Add line break to the tab */
	this.addBr = function(tabId) {
		$.create('br').appendTo($('#' + tabIdPrefix + tabId));
	}
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
 * Do async Ajax request for command execution,
 * replace '\n' in output with '<br>',
 * and set html of p element to command output.
 */
function cmdExecute(cmd, p) {
	$.ajax({
		type: "POST",
		url: "sh/execute.cgi",
		dataType: "text",
		data: {"cmd": cmd},
		dataFilter: function(data, type) {
			return data.replace(/\n/g, "<br>");
		},
		success: function(html) {
			if (p) $(p).html(html);
		}
	});
}

/*
 * Do sync Ajax request for command execution,
 * replace '\n' in output with '<br>',
 * and return command output.
 */
function getCmdOutput(cmd) {
	return $.ajax({
		type: "POST",
		url: "sh/execute.cgi",
		dataType: "text",
		async: false,
		data: {"cmd": cmd},
		dataFilter: function(data, type) {
			return data.replace(/\n/g, "<br>");
		}
	}).responseText;
}

/*
 * Container for widgets.
 * p — parent container.
 * options — container options (subsystem & help), initially passed to pageTabs.
 * helpSection — see details in addContainer method of TabContents object.
 * I18N for widgets.
 */
function Container(p, options, helpSection) {
	if (options && options.subsystem) this.subsystem = options.subsystem;
	this.validator_rules = new Object();
	this.validator_messages = new Object();
	this.info_message = "info_message_" + $(p).attr("id");
	if ($("div[id='" + this.info_message + "']").length == 0) {
		$("<div class='message'></div>").attr("id", this.info_message).appendTo(p);
	}
	this.form = $("<form action=''></form>").appendTo(p).get();
	this.table = $("<table id='conttable' cellpadding='0' cellspacing='0' border='0'></table>").appendTo(this.form).get();

	this.setSubsystem = function(subsystem) {
		this.subsystem = subsystem;
	}
	
	/* 
	 * Adds title and context help link to container and adds it to container's table.
	 * I18N for title.
	 */
	this.addTitle = function(title) {
		var url;
		
		/* if helpSection is object, it contains page and section names */
		if (helpSection && typeof helpSection == "object" && helpSection.page && helpSection.section) {
			url = "/help/" + helpSection.page + ".html#" + helpSection.section;
		/* if we have common help page setted for all tabs */
		} else if (options && options.help) {
			/* if helpSection is set — it is string with section name */
			url = helpSection ? "/help/" + options.help + ".html#" + helpSection :
				"/help/" + options.help + ".html";
		} else {
			url = null;
		}
		
		/* if url is set — create context help link object, otherwise set it to null */
		var help = url ? $.create('a', {'href': '#', 'className': 'helpLink'}, '[?]')
			.click(function() {
				popup(url);
			}) : null;
		
		/* create table's row for title and context help link */
		$.create('tr', {},
			$.create('th', {'colSpan': '2'}, [
					_(title),
					" ",
					help
				]
			)
		).appendTo(this.table);
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
	this.createTextWidget = function(w) {
		var attrs = {
			'type': 'text',
			'name': w.name,
			'size': '25'
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		
		/* set KDB value */
		if (config.get(w.name)) {
			attrs['value'] = config.get(w.name);
		/* if KDB value does't exists — set default value, if it exists */
		} else if (w.defaultValue) {
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
			'type': 'password',
			'name': w.name,
			'size': '25'
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		
		return $.create('input', attrs);
	};
	
	/*
	 * Create checkbox widget.
	 * I18N for tip.
	 */
	this.createCheckboxWidget = function(w) {
		var attrs = {
			'type': 'checkbox',
			'name': w.name,
			'className': 'check',
			'value': '1'
		};
		w.id && (attrs['id'] = w.id);
		w.tip && (attrs['title'] = _(w.tip));
		if (config.get(w.name) == "1") attrs['checked'] = true;
		
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
	 */
	this.createHtml = function(w) {
		var attrs = {'className': 'htmlWidget'};
		w.tip && (attrs['title'] = _(w.tip));
		
		var span = $.create('span', attrs);
		if (w.kdb) {
			$(span).html(config.get(w.name));
		} else if (w.cmd) {
			cmdExecute(w.cmd, span);
		} else if (w.str) {
			$(span).html(w.str);
		}
		
		return span;
	};

	/*
	 * Add complete widget (table's TR) to container.
	 * w — widget to add.
	 * insertAfter — if specified, insert new widget after this element.
	 */
	this.addWidget = function(w, insertAfter) {
		/* add common widget's data. insert specified widget, otherwise insert last */
		if (insertAfter) this.createGeneralWidget(w).insertAfter(insertAfter);
		else this.createGeneralWidget(w).appendTo(this.table);
		
		this.addSubWidget(w);
	};
	
	/*
	 * Add subwidget (input, select, etc) to complete widget or to specified element.
	 * w — widget to add.
	 * insertAfter — if specified, insert new subwidget after this element.
	 */
	this.addSubWidget = function(w, insertAfter) {
		var widget;
		switch (w.type) {
			case "text": 
				widget = this.createTextWidget(w);
				break;
			case "password": 
				widget = this.createPasswordWidget(w);
				break;
			case "checkbox":
				widget = this.createCheckboxWidget(w);
				break;
			case "html":
				widget = this.createHtml(w);
				break;
			case "select":
				widget = this.createSelectWidget(w);
				if (w.options) {
					$(widget).setOptionsForSelect(w.options,
						config.get(w.name), w.defaultValue);
				}
				break;
		}
		
		/* insert new subwidget at specified position */
		if (insertAfter) $(widget).insertAfter(insertAfter);
		else $(widget).prependTo("#td_" + w.name);
		
		/* bind specified events */
		this.bindEvents(w);
		
		w.validator && (this.validator_rules[w.name] = w.validator);
		
		/* I18N for element's error messages */
		w.message && (this.validator_messages[w.name] = _(w.message));
	};
	
	/*
	 * Bind events to widget.
	 */
	this.bindEvents = function(w) {
		if (w.onChange) {
			$("#" + w.id).change(w.onChange);
		}
		
		if (w.onClick) {
			$("#" + w.id).click(w.onClick);
		}
	};
	
	/*
	 * Adds HTML code for command output.
	 */
	this.addConsoleHTML = function(cmd, p) {
		$.create('tr', {},
			$.create('td', {}, [
					$.create('b', {}, cmd),
					$.create('br'),
					$.create('div', {'className': 'pre'})
				]
			)
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
			cmdExecute(cmd, $("tr > td > b:contains('" + cmd + "')", outer.table).nextAll("div.pre"));
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
	 * Adds submit button, form validation rules and submit's events handlers.
	 * options.ajaxTimeout — time in seconds to wait for server reply before show an error message;
	 * options.reload — reload page after AJAX request (e.g., for update translation);
	 * options.onSuccess — callback on request successfully completion.
	 */
	this.addSubmit = function(options) {
		var timeout = (options && options.ajaxTimeout) ? options.ajaxTimeout * 1000 : null;
		var id_info_message = "#" + this.info_message;
		
		/* 
		 * sets error message
		 * I18N for text
		 */
		var setError = function(text) {
			$(id_info_message).html(_(text));
			if ($(id_info_message).hasClass("success_message")) {
				$(id_info_message).removeClass("success_message");
			}
			$(id_info_message).addClass("error_message");
		};
		
		/* sets info message
		 * I18N for text
		 */
		var setInfo = function(text) {
			$(id_info_message).html(_(text));
			if ($(id_info_message).hasClass("error_message")) {
				$(id_info_message).removeClass("error_message");
			}
			$(id_info_message).addClass("success_message");
		};
		
		/* shows message */
		var showMsg = function() {
			$(id_info_message).show();
		};

		/* if subsystem is set — add it to the form */
		if (this.subsystem) {
			$("<input type='hidden' name='subsystem' value='" + this.subsystem + "'/>").appendTo(this.form);
		}

		/* create submit button */
		$("<input type='submit' class='button' value='" + _("Save") + "'/>").appendTo(this.form);
		
		$("input").tooltip({track: true});
		
		/* apply validate rules to form */
		$(this.form).validate({
			rules: this.validator_rules,
			messages: this.validator_messages,
			
			/* container where to show error */
			errorContainer: id_info_message,
			
			/* Set error text to container (closure to setError var) */
			showErrors: function(errorMap, errorList) {
				setError("Please, enter a valid data into the form below to be able to save it successfully.");
				this.defaultShowErrors();
			},
			
			errorPlacement: function(error, element) {
     			error.prependTo(element.parent());
     		},
     		
     		/* (closure to timeout var) */
     		submitHandler: function(form) {
     			/* remove alert text */
				$(".alertText").remove();
		
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
				
				/* submit task (updating settings) for execution */
     			config.kdbSubmit(form, timeout, reload, onSuccess);
				
				/* set checkboxes to their original state */
				$(".doUncheck").each(function() {
					this.checked = false;
					this.value = 1;
				}).removeClass("doUncheck");
     		}
		});
	};
	
	/*
	 * Run command with specified parameters.
	 * First argument — command template (e.g., "/bin/ping -c %ARG %ARG").
	 * Next arguments — name of form's fields to pass as command arguments.
	 * E.g.: addRun("/bin/ping -c %ARG %ARG", "count", "host");
	 */
	this.addRun = function() {
		/* create submit button */
		$.create('input', {'type': 'submit', 'className': 'button', 'value': _("Run")}).appendTo(this.form);

		/* create div for command output */
		$.create('div', {'className': 'pre, cmdOutput'}).appendTo(this.form);
		
		var runArgs = arguments;
		var outer = this;
		$(this.form).submit(function() {
			var cmd;
			
			/* find div for command output for this form (tab) */
			var cmdOutput = $(".cmdOutput", outer.form);
			
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
			
			/* add HTML to div */
			outer.addConsoleHTML(cmd, cmdOutput);
			
			/* set waiting text */
			$("div", cmdOutput).text("Waiting...");
			
			/* execute command */
			cmdExecute(cmd, $("div", cmdOutput));
			
			/* prevent form submission */
			return false;
		});
	};
	
	this.addAction = function(name, cmd) {
		/* create submit button */
		$.create('input', {'type': 'submit', 'className': 'button', 'value': _(name)}).appendTo(this.form);
		
		$(this.form).submit(function() {
			/* execute command */
			cmdExecute(cmd);
			return false;
		});
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
 * Update specified field:
 * update our local KDB, and if value of field was changed — update field and alert user
 * by appending text to field name.
 * ! Field must have ID identical to it's name !
 * 
 * name — name and id of field to update.
 */
function updateField(name) {
	/* save old value, update local KDB and get new value */
	var oldValue = config.get(name);
	config.loadKDB();
	var newValue = config.get(name);
	
	/* if value was updated */
	if (oldValue != newValue) {
		/* set new value */
		$("#" + name).val(newValue);
		
		/* add info text to field name */
		var widgetText = $("#" + name).parents("tr").children(".tdleft");
		var alertText = $.create("span", {"style": "color: red", "className": "alertText"}, " updated");
		widgetText.append(alertText);
	}
}