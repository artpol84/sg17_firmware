# $Id:  $

include $(TOPDIR)/rules.mk

PKG_NAME:=dslam
PKG_RELEASE:=1
PKG_VERSION=1
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)
CFLAGS:=
DEBUG := yes

ifeq ($(BR2_PACKAGE_SIGRAND_DSLAM_DEBUG),y)
    CFLAGS +=-DDEBUG_ON
    DEBUG := yes
endif

include $(TOPDIR)/package/rules.mk

$(eval $(call PKG_template,SIGRAND_DSLAM,dslam,$(PKG_VERSION)-$(PKG_RELEASE),$(ARCH)))

$(PKG_BUILD_DIR)/.prepared:
	@echo "PKG_DIR="$(PKG_BUILD_DIR)
	mkdir -p $(PKG_BUILD_DIR)
	cp -R dslam-sw $(PKG_BUILD_DIR)
	touch $@

$(PKG_BUILD_DIR)/.configured:
	rm --preserve-root -f $(PKG_BUILD_DIR)/dslam-sw/Makefile
	@echo "CFLAGS=$(CFLAGS)"
	sed <$(PKG_BUILD_DIR)/dslam-sw/Makefile.tmpl \
	> $(PKG_BUILD_DIR)/dslam-sw/Makefile \
	-e "s%@KERNSRC@%$(LINUX_DIR)%g" \
	-e "s%@CROSS_PREFIX@%$(KERNEL_CROSS)%g" \
	-e "s%@CFLAGS@%$(CFLAGS)%g" \
	-e "s%@KERNVER@%2.6.16%g" \
	-e "s%@INST_PATH@%$(IDIR_SIGRAND_DSLAM)%g" \
	-e "s%@DEBUG@%$(DEBUG)%g"
	touch $@

$(PKG_BUILD_DIR)/.built: $(PKG_BUILD_DIR)/.configured
	cd $(PKG_BUILD_DIR)/dslam-sw && make
	touch $@

$(IPKG_SIGRAND_DSLAM):
	install -d -m0755 $(IDIR_SIGRAND_DSLAM)/lib/modules/2.6.16
	install -m 644 $(PKG_BUILD_DIR)/dslam-sw/dslam_sw.ko $(IDIR_SIGRAND_DSLAM)/lib/modules/2.6.16/
	install -d -m0755 $(IDIR_SIGRAND_DSLAM)/sbin
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/tools/dslam_debug $(IDIR_SIGRAND_DSLAM)/sbin/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/cli $(IDIR_SIGRAND_DSLAM)/sbin/
	install -d -m0755 $(IDIR_SIGRAND_DSLAM)/etc/cli
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/auto_completion $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/help $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/network $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/port $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/services $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/services_cos $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/services_security $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/services_storm_control $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/services_vlan $(IDIR_SIGRAND_DSLAM)/etc/cli/
	install -m0755  $(PKG_BUILD_DIR)/dslam-sw/cli/system $(IDIR_SIGRAND_DSLAM)/etc/cli/
	$(IPKG_BUILD) $(IDIR_SIGRAND_DSLAM) $(PACKAGE_DIR)

#local_build: $(PKG_BUILD_DIR)/.prepared
#	cd $(PKG_BUILD_DIR)/dslam-sw && make KERN_PATH=$(LINUX_DIR) CROSS_PREFIX=$(STAGING_DIR)/bin/mipsel-linux-
