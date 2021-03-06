include $(TOPDIR)/.config
SHELL=/bin/bash
export SHELL

TRACE:=echo "---> "
START_TRACE:=echo -n "---> "
END_TRACE:=echo

CMD_TRACE:=echo -n
PKG_TRACE:=echo "------> "

LOG_FILE = $(TOPDIR)/log/$(subst /,_,$(subst $(TOPDIR)/,,$(CURDIR))_$(subst build_mipsel/,,$(subst $(TOPDIR)/,,$@))).log

MAKE_TRACE = 1>>$(LOG_FILE) 2>>$(LOG_FILE)

#EXTRA_MAKEFLAGS += -j --max-load 10
EXTRA_MAKEFLAGS += --no-print-directory

MAKE1 := make -j1
MAKE  := make $(EXTRA_MAKEFLAGS)

CP = cp -fvpR

# Strip off the annoying quoting
ARCH:=$(strip $(subst ",, $(BR2_ARCH)))
WGET:=$(strip $(subst ",, $(BR2_WGET)))
GCC_VERSION:=$(strip $(subst ",, $(BR2_GCC_VERSION)))
GCC_USE_SJLJ_EXCEPTIONS:=$(strip $(subst ",, $(BR2_GCC_USE_SJLJ_EXCEPTIONS)))
TARGET_OPTIMIZATION:=$(strip $(subst ",, $(BR2_TARGET_OPTIMIZATION)))
#"))"))"))"))")) # for vim's broken syntax highlighting :)


ifeq ($(BR2_SOFT_FLOAT),y)
# gcc 3.4.x soft float configuration is different than previous versions.
ifeq ($(findstring 3.4.,$(GCC_VERSION)),3.4.)
SOFT_FLOAT_CONFIG_OPTION:=--with-float=soft
else
SOFT_FLOAT_CONFIG_OPTION:=--without-float
endif
TARGET_SOFT_FLOAT:=-msoft-float
ARCH_FPU_SUFFIX:=_nofpu
else
SOFT_FLOAT_CONFIG_OPTION:=
TARGET_SOFT_FLOAT:=
ARCH_FPU_SUFFIX:=
endif


ifeq ($(BR2_TAR_VERBOSITY),y)
TAR_OPTIONS=--wildcards -xvf
else
TAR_OPTIONS=--wildcards -xf
endif

ifneq ($(BR2_LARGEFILE),y)
DISABLE_LARGEFILE= --disable-largefile
endif
TARGET_CFLAGS:=$(TARGET_OPTIMIZATION) $(TARGET_DEBUGGING)

OPTIMIZE_FOR_CPU=$(ARCH)
HOSTCC:=gcc
BASE_DIR:=$(TOPDIR)
DL_DIR:=$(BASE_DIR)/dl
BUILD_DIR:=$(BASE_DIR)/build_$(ARCH)$(ARCH_FPU_SUFFIX)
STAGING_DIR:=$(BASE_DIR)/staging_dir_$(ARCH)$(ARCH_FPU_SUFFIX)
SCRIPT_DIR:=$(BASE_DIR)/scripts
BIN_DIR:=$(BASE_DIR)/bin
STAMP_DIR:=$(BUILD_DIR)/stamp
PACKAGE_DIR:=$(BIN_DIR)/packages
TARGET_DIR:=$(BUILD_DIR)/root
TOOL_BUILD_DIR=$(BASE_DIR)/toolchain_build_$(ARCH)$(ARCH_FPU_SUFFIX)
TARGET_PATH=$(if $(CCACHE),$(_CCACHE_PATH_):)$(STAGING_DIR)/usr/bin:$(STAGING_DIR)/bin:/bin:/sbin:/usr/bin:/usr/sbin
IMAGE:=$(BUILD_DIR)/root_fs_$(ARCH)$(ARCH_FPU_SUFFIX)
REAL_GNU_TARGET_NAME=$(OPTIMIZE_FOR_CPU)-linux-uclibc
GNU_TARGET_NAME=$(OPTIMIZE_FOR_CPU)-linux
_KERNEL_CROSS_:=$(STAGING_DIR)/bin/$(OPTIMIZE_FOR_CPU)-linux-uclibc-
KERNEL_CROSS:=$(if $(CCACHE),$(CCACHE) $(_KERNEL_CROSS_),$(_KERNEL_CROSS_))
_TARGET_CROSS_:=$(STAGING_DIR)/bin/$(OPTIMIZE_FOR_CPU)-linux-uclibc-
TARGET_CROSS:=$(if $(CCACHE),$(CCACHE) $(_TARGET_CROSS_),$(_TARGET_CROSS_))
_TARGET_CC_:=$(_TARGET_CROSS_)gcc
TARGET_CC:=$(TARGET_CROSS)gcc
STRIP:=$(STAGING_DIR)/bin/sstrip
PATCH=$(SCRIPT_DIR)/patch-kernel.sh
SED:=$(STAGING_DIR)/bin/sed -i -e
LINUX_DIR:=$(BUILD_DIR)/linux
LINUX_HEADERS_DIR:=$(TOOL_BUILD_DIR)/linux


HOST_ARCH:=$(shell $(HOSTCC) -dumpmachine | sed -e s'/-.*//' \
	-e 's/sparc.*/sparc/' \
	-e 's/arm.*/arm/g' \
	-e 's/m68k.*/m68k/' \
	-e 's/ppc/powerpc/g' \
	-e 's/v850.*/v850/g' \
	-e 's/sh[234]/sh/' \
	-e 's/mips-.*/mips/' \
	-e 's/mipsel-.*/mipsel/' \
	-e 's/cris.*/cris/' \
	-e 's/i[3-9]86/i386/' \
	)
GNU_HOST_NAME:=$(HOST_ARCH)-pc-linux-gnu
TARGET_CONFIGURE_OPTS=PATH=$(TARGET_PATH) \
		AR="$(TARGET_CROSS)ar" \
		AS="$(TARGET_CROSS)as" \
		LD="$(TARGET_CROSS)ld" \
		NM="$(TARGET_CROSS)nm" \
		CC="$(TARGET_CROSS)gcc" \
		GCC="$(TARGET_CROSS)gcc" \
		CXX="$(TARGET_CROSS)g++" \
		RANLIB="$(TARGET_CROSS)ranlib"

ifeq ($(ENABLE_LOCALE),true)
DISABLE_NLS:=
else
DISABLE_NLS:=--disable-nls
endif

ifeq ($(BR2_ENABLE_MULTILIB),y)
MULTILIB:=--enable-multilib
endif

# invoke ipkg-build with some default options
IPKG_BUILD := PATH="$(TARGET_PATH)" ipkg-build -c -o root -g root
# where to build (and put) .ipk packages
IPKG_TARGET_DIR := $(PACKAGE_DIR)
IPKG:=IPKG_TMP=$(BUILD_DIR)/tmp IPKG_INSTROOT=$(TARGET_DIR) IPKG_CONF_DIR=$(STAGING_DIR)/etc IPKG_OFFLINE_ROOT=$(BUILD_DIR)/root $(SCRIPT_DIR)/ipkg -force-defaults -force-depends
IPKG_STATE_DIR := $(TARGET_DIR)/usr/lib/ipkg

RSTRIP:=STRIP="$(STRIP)" $(SCRIPT_DIR)/rstrip.sh
RSTRIP_KMOD:=STRIP="$(TARGET_CROSS)strip --strip-unneeded --remove-section=.comment" $(SCRIPT_DIR)/rstrip.sh
