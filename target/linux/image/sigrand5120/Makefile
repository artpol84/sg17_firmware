include $(TOPDIR)/rules.mk

KDIR:=$(BUILD_DIR)/linux-$(KERNEL)-$(BOARD)

REV := $(shell $(TOPDIR)/rev.sh)
REV ?= 0


export PADFILE=$(STAGING_DIR)/bin/padfile

$(SCRIPT_DIR)/padfile:
	$(HOSTCC) src/padfile.c -o $(PADFILE)


ifeq ($(KERNEL),2.6)

ifeq ($(FS),jffs2-32MB)

LINUX_VERSION:=2.6.16
LINUX_BUILD_DIR:=$(BUILD_DIR)/linux-$(KERNEL)-$(BOARD)
adm5120-fs-prepare:
	test -f delete-files-$(KERNEL)-$(FS) && \
			for f in `cat delete-files-$(KERNEL)-$(FS)`; do \
				rm -rf $(KDIR)/root/$$f;	\
			done;
	( cd ../../package/base-files/files/$(BOARD)-$(KERNEL) && \
		tar cf - . | tar xvf - -C $(KDIR)/root/; \
		[ "$(BR2_SIGRAND_OEM_LOGO)" != "default" ] && echo "Revision: \$$R " > $(KDIR)/root/etc/banner; \
		 $(SED) 's,$$R,$(REV),g' $(KDIR)/root/etc/banner; \
		 echo "Built at: `date '+%Y%m%d %H:%M'`" >>$(KDIR)/root/etc/banner; \
		 echo "" >>$(KDIR)/root/etc/banner; \
		 echo "$(REV)" >$(KDIR)/root/etc/version; \
	)
	if [ ! -L $(KDIR)/root/bin/sh ]; then \
		ln -fs /bin/dash $(KDIR)/root/bin/sh; \
	fi

ifeq ($(LOGO), 1)
	echo "" >$(KDIR)/root/etc/banner
	echo "Revision: $(REV)" >>$(KDIR)/root/etc/banner
	echo "Builded at: `date '+%Y%m%d %H:%M'`" >>$(KDIR)/root/etc/banner
	echo "" >>$(KDIR)/root/etc/banner
endif


OEM := $(shell echo $(BR2_SIGRAND_OEM_MANUFACTURER) | tr A-Z a-z)
NOFW = $(if $(SIGRAND_LINUX_NOFW),-nofw,)

$(BIN_DIR)/openwrt-$(BOARD)-$(KERNEL)-$(FS).bin: $(SCRIPT_DIR)/padfile
	SG_KERNEL_BLOCKS=$(SG_KERNEL_BLOCKS)	\
	SG_FS_BLOCKS=$(SG_FS_BLOCKS)		\
	PADFILE=$(PADFILE)			\
	CROSS_COMPILE=$(TARGET_CROSS)		\
	IMG_NAME=$(BIN_DIR)/sg17-r-cp1_$(REV)$(NOFW)_$(OEM).bin	\
	/bin/sh ./mkimage-jffs2 $(KDIR)/root.jffs2-32MB $(BUILD_DIR)/linux/vmlinux
endif

endif

clean:
prepare: adm5120-fs-prepare
compile:
install: $(BIN_DIR)/openwrt-$(BOARD)-$(KERNEL)-$(FS).bin
