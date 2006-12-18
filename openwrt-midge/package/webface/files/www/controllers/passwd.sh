#!/usr/bin/haserl
	. conf/conf.sh
	. lib/misc.sh
	. lib/widgets.sh

	passwd=${FORM_passwd}
	htpasswd=${FORM_htpasswd}
	form=${FORM_form}

	if [ $REQUEST_METHOD = POST ]; then
		#render_table_title "$page" 2 
		
		case $form in
		htpasswd)
			(echo $htpasswd; echo $passwd  ) |  htpasswd  /etc/htpasswd admin  2>&1 | $LOGGER
		;;
		passwd)
			(echo $passwd; sleep 1; echo $passwd  ) | passwd root 2>&1 | $LOGGER
		;;
		esac
		[ $? = 0 ] && ok_str="Password changed" || ERROR_MESSAGE="Error occured while updating password"
		render_save_message
	fi
	

	render_form_header 
	render_table_title "Webface admin password" 2 
	tip="Valid symbols A-Z, a-z, 0-9"
	render_input_field hidden form form htpasswd
	validator='tmt:required="true" tmt:message="Please input admin password" tmt:filters="ltrim,rtrim,nohtml,nospaces,nocommas,nomagic"'
	render_input_field password "Password" htpasswd 
	render_submit_field 
	render_form_tail

	render_form_header 
	render_table_title "root system password" 2 
	tip="Valid symbols A-Z, a-z, 0-9"
	render_input_field hidden form form passwd
	validator='tmt:required="true" tmt:message="Please input root password" tmt:filters="ltrim,rtrim,nohtml,nospaces,nocommas,nomagic"'
	render_input_field password "Password" passwd 
	render_submit_field 
	render_form_tail

	

