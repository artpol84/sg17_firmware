/* IP address */
jQuery.validator.addMethod("ipAddr", function(value, element) {
	return this.optional(element) ||
		/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(value);
}, "Please enter correct IP address.");

/* IP port */
jQuery.validator.addMethod("ipPort", function(value, element) {
	return this.optional(element) || /^((\d)+|any)$/.test(value);
}, "Please enter correct IP port.");

/* Domain name */
jQuery.validator.addMethod("domainName", function(value, element) {
	return this.optional(element) || /^[a-zA-Z0-9]+([a-zA-Z0-9\-\.]+)?$/.test(value);
}, "Please enter correct domain name.");

/* map of slots for E1 */
jQuery.validator.addMethod("smap", function(value, element) {
	return this.optional(element) ||
		/^(([0-9]+,)|([0-9]+-[0-9]+(,)?)|([0-9]+$))+$/.test(value);
}, "Please enter correct slot map.");

/* VoIP's router id */
jQuery.validator.addMethod("voipRouterID", function(value, element) {
	return this.optional(element) || /^([0-9]){3}$/.test(value);
}, "Please enter correct Router ID.");

/* VoIP's registrar */
jQuery.validator.addMethod("voipRegistrar", function(value, element) {
	return this.optional(element) || /^sip:(([a-zA-Z0-9]+([a-zA-Z0-9\-\.]+)?)|((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])))$/.test(value);
}, "Please enter correct registrar name or it's IP-address, with sip: prefix.");

/* VoIP's SIP URI */
jQuery.validator.addMethod("voipSipUri", function(value, element) {
	return this.optional(element) || /^sip:([_a-zA-Z0-9]\.*)+@([_a-zA-Z0-9]\.?)+/.test(value);
}, "Please enter correct user SIP URI, with sip: prefix.");

/* VoIP's short number */
jQuery.validator.addMethod("voipShortNumber", function(value, element) {
	return this.optional(element) || /^([0-9]){2}$/.test(value);
}, "Please enter 2-digit positive number.");

/* VoIP's complete number */
jQuery.validator.addMethod("voipCompleteNumber", function(value, element) {
	return this.optional(element) || /^((([0-9]{3}|[\*]))((([-,]*)([0-9]{2}|[\*])([-,]*)([-0-9,]*))|(([-,]*)[#]sip:([_a-zA-Z0-9]\.?)+@([_a-zA-Z0-9]\.?)+[#])))$/.test(value);
}, "Please enter correct complete number.");

/* PBO value */
jQuery.validator.addMethod("pbo", function(value, element) {
	return this.optional(element) || /^(\d+(:\d+)?)+$/.test(value);
}, "Please enter correct PBO value.");