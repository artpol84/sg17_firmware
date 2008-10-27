
/* Includes {{{*/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <assert.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <getopt.h>

#include "ab_api.h"
#include "ifx_types.h"
#include "vinetic_io.h"
/*}}}*/

#define DEV_NODE_LENGTH 30
#define WRITE_VAL	0xDEAD 
#define PRINT_SCALE	10000
#define PRINT_SCALE_STR	"0000"

unsigned long int g_error_counter=0;

typedef unsigned char byte_t;

struct opts_s {/*{{{*/
	enum wide_e {wide_byte, wide_double_byte} wide;
	enum mode_e {mode_none, mode_read, mode_write, mode_wrrd} mode;
	int first_dev;
	int second_dev;
	int both;
	int help;
} g_so;/*}}}*/

int
startup_init (int argc, char * const argv[])
{/*{{{*/
	int option_IDX;
	int option_rez;
	char * short_options = "hrwbdf:s:";
	struct option long_options[ ] = {
		{ "help", no_argument, NULL, 'h' },
		{ "read", no_argument, NULL, 'r' },
		{ "write", no_argument, NULL, 'w' },
		{ "byte-wide", no_argument, NULL, 'b' },
		{ "double-byte-wide", no_argument, NULL, 'd' },
		{ "first-device", required_argument, NULL, 'f' },
		{ "second-device", required_argument, NULL, 's' },
		{ NULL, 0, NULL, 0 }
	};


	memset(&g_so, 0, sizeof(g_so));
	g_so.first_dev = -1;
	g_so.second_dev = -1;

	opterr = 0;
	while ((option_rez = getopt_long ( 
			argc, argv, short_options, long_options, &option_IDX)) != -1){
		switch( option_rez ){
		case 'h':
			g_so.help = 1;
			return 1;
		case 'r':
			if(g_so.mode == mode_none){
				g_so.mode = mode_read;
			} else if(g_so.mode == mode_read){
				g_so.mode = mode_read;
			} else if(g_so.mode == mode_write){
				g_so.mode = mode_wrrd;
			} else if(g_so.mode == mode_wrrd){
				g_so.mode = mode_wrrd;
			}
			break;
		case 'w':
			if(g_so.mode == mode_none){
				g_so.mode = mode_write;
			} else if(g_so.mode == mode_read){
				g_so.mode = mode_wrrd;
			} else if(g_so.mode == mode_write){
				g_so.mode = mode_write;
			} else if(g_so.mode == mode_wrrd){
				g_so.mode = mode_wrrd;
			}
			break;
		case 'b':
			g_so.wide = wide_byte;
			break;
		case 'd':
			g_so.wide = wide_double_byte;
			break;
		case 'f':
			g_so.first_dev = strtol(optarg, NULL, 10);
			break;
		case 's':
			g_so.second_dev = strtol(optarg, NULL, 10);
			break;
		case '?' :
			return -1;
		}
	}

	if(g_so.mode == mode_none){
		g_so.mode = mode_wrrd;
	}
	if((g_so.first_dev == -1) && (g_so.second_dev != -1)){
		g_so.first_dev = g_so.second_dev;
		g_so.second_dev = -1;
	}
	if((g_so.first_dev == -1) && (g_so.second_dev == -1)){
		g_so.first_dev = 0;
	}
	if((g_so.first_dev != -1) && (g_so.second_dev != -1)){
		g_so.both = 1;
	}
	return 0;
}/*}}}*/

void 
print_help(void)
{/*{{{*/
	printf("Use it with options:\n\
\t-h, --help - help message.\n\
==============================\n\
\t-w, --write                  - write mode on.\n\
\t-r, --read                   - read mode on.\n\
\n\
\t\tif you do not set any or set both, write-read mode\n\
\t\t\twill be set.\n\
==============================\n\
\t-b, --byte-wide              - byte wide operations.\n\
\t-d, --double-byte-wide       - double byte wide operations\n\
\n\
\t\tdefault mode is byte-wide.\n\
==============================\n\
\t-f, --first-device = <num>   - first device index.\n\
\t-s, --second-device = <num>  - second device index.\n\
\n\
\t\tif no options set, using just first device with index 0\n\
==============================\n\
\texample: iotst -r -f0 -s1 -d\n\
==============================\n");
}/*}}}*/

void
print_it_info(int it_val)
{/*{{{*/
	static unsigned long int scaled_counter=0;

	if(!(it_val % PRINT_SCALE)){
		scaled_counter++;
		fprintf(stderr, "\r[%ld%s] errors : %ld",
				scaled_counter,PRINT_SCALE_STR,g_error_counter);
	}
}/*}}}*/

void
read_mode(void)
{/*{{{*/
	char dnode_1[DEV_NODE_LENGTH];
	char dnode_2[DEV_NODE_LENGTH];
	int cfg_fd_1;
	int cfg_fd_2;
	unsigned short int var1;
	unsigned short int var2;
	unsigned long int it_val = 1;
 
	memset(dnode_1, 0, DEV_NODE_LENGTH);
	sprintf(dnode_1, "/dev/vin%d0",g_so.first_dev+1);
	cfg_fd_1 = open(dnode_1,O_RDWR);
	if(cfg_fd_1 == -1){
		fprintf(stderr, "Can`t open '%s'\n",dnode_1);
		return;
	}

	if(g_so.both){
		memset(dnode_2, 0, DEV_NODE_LENGTH);
		sprintf(dnode_2, "/dev/vin%d0",g_so.second_dev+1);
		cfg_fd_2 = open(dnode_2,O_RDWR);
		if(cfg_fd_2 == -1){
			fprintf(stderr, "Can`t open '%s'\n",dnode_2);
			close(cfg_fd_1);
			return;
		}
	}

	/* write */
	ioctl(cfg_fd_1, FIO_VINETIC_TCA, WRITE_VAL);
	if(g_so.both){
		ioctl(cfg_fd_2, FIO_VINETIC_TCA, WRITE_VAL);
	}


	while(1){
		print_it_info(it_val);

		/* read */
		var1 = ioctl(cfg_fd_1, FIO_VINETIC_TCA, 0);
		if(g_so.both){
			var2 = ioctl(cfg_fd_2, FIO_VINETIC_TCA, 0);
		}

		if(g_so.wide == wide_byte){
			/* test both values */
			if((byte_t)var1 != (byte_t)WRITE_VAL){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"Write=0x%02X Read=0x%02X",
						it_val, g_so.first_dev, 
						(byte_t)WRITE_VAL, (byte_t)var1);
			}
			if(g_so.both && ((byte_t)var2 != (byte_t)WRITE_VAL)){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"Write=0x%02X Read=0x%02X",
						it_val, g_so.second_dev, 
						(byte_t)WRITE_VAL, (byte_t)var2);
			}

			if(((byte_t)var1 != (byte_t)WRITE_VAL) || 
					(g_so.both && ((byte_t)var2 != (byte_t)WRITE_VAL))){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		} else {
			/* test both values */
			if(var1 != WRITE_VAL){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"Write=0x%04X Read=0x%04X",
						it_val, g_so.first_dev, WRITE_VAL, var1);
			}
			if(g_so.both && (var2 != WRITE_VAL)){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"Write=0x%04X Read=0x%04X",
						it_val, g_so.second_dev, WRITE_VAL, var2);
			}

			if((var1 != WRITE_VAL) || (g_so.both && (var2 != WRITE_VAL))){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		}
		it_val++;
	}

	close(cfg_fd_1);
	if(g_so.both){
		close(cfg_fd_2);
	}
}/*}}}*/

void
write_mode(void)
{/*{{{*/
	char dnode_1[DEV_NODE_LENGTH];
	char dnode_2[DEV_NODE_LENGTH];
	int cfg_fd_1;
	int cfg_fd_2;
	unsigned short int var11, var12, var13;
	unsigned short int var21, var22, var23;
	unsigned short int wr_val = 1;
	unsigned long int it_val = 1;

	memset(dnode_1, 0, DEV_NODE_LENGTH);
	sprintf(dnode_1, "/dev/vin%d0",g_so.first_dev+1);
	cfg_fd_1 = open(dnode_1,O_RDWR);
	if(cfg_fd_1 == -1){
		fprintf(stderr, "Can`t open '%s'\n",dnode_1);
		return;
	}

	if(g_so.both){
		memset(dnode_2, 0, DEV_NODE_LENGTH);
		sprintf(dnode_2, "/dev/vin%d0",g_so.second_dev+1);
		cfg_fd_2 = open(dnode_2,O_RDWR);
		if(cfg_fd_2 == -1){
			fprintf(stderr, "Can`t open '%s'\n",dnode_2);
			close(cfg_fd_1);
			return;
		}
	}

	while(1){
		print_it_info(it_val);

		if(!wr_val){
			wr_val++;
		}

		/* write */
		ioctl(cfg_fd_1, FIO_VINETIC_TCA, wr_val);
		if(g_so.both){
			ioctl(cfg_fd_2, FIO_VINETIC_TCA, wr_val);
		}

#if 0
		/* read */
		var11 = ioctl(cfg_fd_1, FIO_VINETIC_TCA, 0);
		var12 = ioctl(cfg_fd_1, FIO_VINETIC_TCA, 0);
		var13 = ioctl(cfg_fd_1, FIO_VINETIC_TCA, 0);
		if(g_so.both){
			var21 = ioctl(cfg_fd_2, FIO_VINETIC_TCA, 0);
			var22 = ioctl(cfg_fd_2, FIO_VINETIC_TCA, 0);
			var23 = ioctl(cfg_fd_2, FIO_VINETIC_TCA, 0);
		}

		if(g_so.wide == wide_byte){
			int error1 = (
					((byte_t)wr_val != (byte_t)var11) && 
					((byte_t)wr_val != (byte_t)var12) && 
					((byte_t)wr_val != (byte_t)var12));
			int error2 = (
					((byte_t)wr_val != (byte_t)var21) && 
					((byte_t)wr_val != (byte_t)var22) && 
					((byte_t)wr_val != (byte_t)var22));
			if(error1){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"W=0x%02X R1=0x%02X R2=0x%02X R3=0x%02X",
						it_val, g_so.first_dev, (byte_t)wr_val, 
						(byte_t)var11, (byte_t)var12, (byte_t)var13);
			}
			if(g_so.both && error2){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"W=0x%02X R1=0x%02X R2=0x%02X R3=0x%02X",
						it_val, g_so.second_dev, (byte_t)wr_val, 
						(byte_t)var21, (byte_t)var22, (byte_t)var23);
			}
			if(error1 || (g_so.both && error2)){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		} else {
			int error1 = (
					(wr_val != var11) || 
					(wr_val != var12) || 
					(wr_val != var12));
			int error2 = (
					(wr_val != var21) || 
					(wr_val != var22) || 
					(wr_val != var22));
			if(error1){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"W=0x%04X R1=0x%04X R2=0x%04X R3=0x%04X",
						it_val, g_so.first_dev, wr_val, 
						var11, var12, var13);
			}
			if(g_so.both && error2){
				fprintf(stderr,"\n[%ld]DEV_[%d] Read fail: "
						"W=0x%04X R1=0x%04X R2=0x%04X R3=0x%04X",
						it_val, g_so.second_dev, wr_val, 
						var21, var22, var23);
			}
			if(error1 || (g_so.both && error2)){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		}
#endif
		it_val++;
		wr_val++;
	}

	close(cfg_fd_1);
	if(g_so.both){
		close(cfg_fd_2);
	}
}/*}}}*/

void
wrrd_mode(void)
{/*{{{*/
	char dnode_1[DEV_NODE_LENGTH];
	char dnode_2[DEV_NODE_LENGTH];
	int cfg_fd_1;
	int cfg_fd_2;
	unsigned short int var1;
	unsigned short int var2;
	unsigned short int wr_val = 1;
	unsigned long int it_val = 1;

	memset(dnode_1, 0, DEV_NODE_LENGTH);
	sprintf(dnode_1, "/dev/vin%d0",g_so.first_dev+1);
	cfg_fd_1 = open(dnode_1,O_RDWR);
	if(cfg_fd_1 == -1){
		fprintf(stderr, "Can`t open '%s'\n",dnode_1);
		return;
	}

	if(g_so.both){
		memset(dnode_2, 0, DEV_NODE_LENGTH);
		sprintf(dnode_2, "/dev/vin%d0",g_so.second_dev+1);
		cfg_fd_2 = open(dnode_2,O_RDWR);
		if(cfg_fd_2 == -1){
			fprintf(stderr, "Can`t open '%s'\n",dnode_2);
			close(cfg_fd_1);
			return;
		}
	}

	while(1){
		print_it_info(it_val);

		if(!wr_val){
			wr_val++;
		}

		/* write */
		ioctl(cfg_fd_1, FIO_VINETIC_TCA, wr_val);
		if(g_so.both){
			ioctl(cfg_fd_2, FIO_VINETIC_TCA, wr_val);
		}

		/* read */
		var1 = ioctl(cfg_fd_1, FIO_VINETIC_TCA, 0);
		if(g_so.both){
			var2 = ioctl(cfg_fd_2, FIO_VINETIC_TCA, 0);
		}

		if(g_so.wide == wide_byte){
			/* test both values */
			if((byte_t)var1 != (byte_t)wr_val){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"Write=0x%02X W/R=0x%02X",
						it_val, g_so.first_dev, 
						(byte_t)wr_val, (byte_t)var1);
			}
			if(g_so.both && ((byte_t)var2 != (byte_t)wr_val)){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"Write=0x%02X W/R=0x%02X",
						it_val, g_so.second_dev, 
						(byte_t)wr_val, (byte_t)var2);
			}

			if(((byte_t)var1 != (byte_t)wr_val) || 
					(g_so.both && ((byte_t)var2 != (byte_t)wr_val))){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		} else {
			/* test both values */
			if(var1 != wr_val){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"Write=0x%04X W/R=0x%04X",
						it_val, g_so.first_dev, wr_val, var1);
			}
			if(g_so.both && (var2 != wr_val)){
				fprintf(stderr,"\n[%ld]DEV_[%d] W/R fail: "
						"Write=0x%04X W/R=0x%04X",
						it_val, g_so.second_dev, wr_val, var2);
			}

			if((var1 != wr_val) || (g_so.both && (var2 != wr_val))){
				fprintf(stderr, "\n");
				g_error_counter++;
			}
		}
		it_val++;
		wr_val++;
	}

	close(cfg_fd_1);
	if(g_so.both){
		close(cfg_fd_2);
	}
}/*}}}*/

int 
main (int argc, char * const argv[])
{/*{{{*/
	int ret;
	ret = startup_init (argc,argv);
	if(ret == 1){
		print_help();
		return 0;
	} else if(ret == -1){
		printf("ERROR!\n");
		print_help();
		return 1;
	}

	fprintf(stderr,"wide[%d] ",g_so.wide+1); 

	if(g_so.mode == mode_read){
		fprintf(stderr,"mode[read] first[%d] second[%d]\n",
				g_so.first_dev,g_so.second_dev); 
		read_mode();
	} else if (g_so.mode == mode_write){
		fprintf(stderr,"mode[write] first[%d] second[%d]\n",
				g_so.first_dev,g_so.second_dev); 
		write_mode();
	} else {
		fprintf(stderr,"mode[wrrd] first[%d] second[%d]\n",
				g_so.first_dev,g_so.second_dev); 
		wrrd_mode();
	}

	return 0;
}/*}}}*/

