# $Id:  $

include $(TOPDIR)/rules.mk

PKG_NAME:=linkdeps
PKG_VERSION=1
PKG_RELEASE=1

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(TOPDIR)/package/rules.mk

$(eval $(call PKG_template,SIGRAND_LINKDEPS,linkdeps,$(PKG_VERSION)-$(PKG_RELEASE),$(ARCH)))

$(PKG_BUILD_DIR)/.prepared:
	@echo "PKG_DIR="$(PKG_BUILD_DIR)
	mkdir -p $(PKG_BUILD_DIR)
	touch $@

$(PKG_BUILD_DIR)/.configured:
	touch $@

$(PKG_BUILD_DIR)/.built: $(PKG_BUILD_DIR)/.configured
	touch $@

$(IPKG_SIGRAND_LINKDEPS):
	install -d -m0755 $(IDIR_SIGRAND_LINKDEPS)/sbin
	install -d -m0755 $(IDIR_SIGRAND_LINKDEPS)/etc/linkdeps
	cp _linkhandler $(IDIR_SIGRAND_LINKDEPS)/sbin
	tar cf - -C linkdeps . | tar xvf - -C $(IDIR_SIGRAND_LINKDEPS)/etc/linkdeps
	$(IPKG_BUILD) $(IDIR_SIGRAND_LINKDEPS) $(PACKAGE_DIR)
