#ifndef _DRV_TAPI_KPI_IO_H
#define _DRV_TAPI_KPI_IO_H
/******************************************************************************

                               Copyright (c) 2007
                            Infineon Technologies AG
                     Am Campeon 1-12; 81726 Munich, Germany

  THE DELIVERY OF THIS SOFTWARE AS WELL AS THE HEREBY GRANTED NON-EXCLUSIVE,
  WORLDWIDE LICENSE TO USE, COPY, MODIFY, DISTRIBUTE AND SUBLICENSE THIS
  SOFTWARE IS FREE OF CHARGE.

  THE LICENSED SOFTWARE IS PROVIDED "AS IS" AND INFINEON EXPRESSLY DISCLAIMS
  ALL REPRESENTATIONS AND WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING
  WITHOUT LIMITATION, WARRANTIES OR REPRESENTATIONS OF WORKMANSHIP,
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, DURABILITY, THAT THE
  OPERATING OF THE LICENSED SOFTWARE WILL BE ERROR FREE OR FREE OF ANY THIRD
  PARTY CLAIMS, INCLUDING WITHOUT LIMITATION CLAIMS OF THIRD PARTY INTELLECTUAL
  PROPERTY INFRINGEMENT.

  EXCEPT FOR ANY LIABILITY DUE TO WILFUL ACTS OR GROSS NEGLIGENCE AND EXCEPT
  FOR ANY PERSONAL INJURY INFINEON SHALL IN NO EVENT BE LIABLE FOR ANY CLAIM
  OR DAMAGES OF ANY KIND, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
  DEALINGS IN THE SOFTWARE.

******************************************************************************/

/**
   \file drv_tapi_kpi_io.h
   This file contains the interface declaration that can be used by other
   drivers to access the "Kernel Packet Interface" (KPI).
   The KPI is used to exchange packetised data with other drivers.
*/

/*@{*/

/** \defgroup TAPI_INTERFACE_KPI Kernel Packet interface
    Function interface that can be used by other drivers to exchange packetised
    voice streams with the TAPI driver. */

/*@}*/


/** \addtogroup TAPI_INTERFACE_KPI */
/*@{*/

/* ========================================================================== */
/*                                 Includes                                   */
/* ========================================================================== */
#include "ifx_types.h"


/* ========================================================================== */
/*                               Configuration                                */
/* ========================================================================== */
/** Definition of maximum KPI group that can be used (allowed range: 1 - 15). */
#define IFX_TAPI_KPI_MAX_GROUP              2

/** Definition of the maximum channel in an KPI group. Same for all groups. */
#define IFX_TAPI_KPI_MAX_CHANNEL_PER_GROUP  6

/* Alias names for groups. */
#define IFX_TAPI_KPI_UDP                    IFX_TAPI_KPI_GROUP1
#define IFX_TAPI_KPI_DECT                   IFX_TAPI_KPI_GROUP2

/* Defines the size of the fifos in each KPI channel. Same for all groups. */
#define IFX_TAPI_KPI_EGRESS_FIFO_SIZE       20
#define IFX_TAPI_KPI_INGRESS_FIFO_SIZE      20


/* ========================================================================== */
/*                             Macro definitions                              */
/* ========================================================================== */
/** Definition of KPI group 1 */
#define IFX_TAPI_KPI_GROUP1       0x1000
/** Definition of KPI group 2 */
#define IFX_TAPI_KPI_GROUP2       0x2000
/** Definition of KPI group 3 */
#define IFX_TAPI_KPI_GROUP3       0x3000
/** Definition of KPI group 4 */
#define IFX_TAPI_KPI_GROUP4       0x4000
/** Definition of KPI group 5 */
#define IFX_TAPI_KPI_GROUP5       0x5000
/** Definition of KPI group 6 */
#define IFX_TAPI_KPI_GROUP6       0x6000
/** Definition of KPI group 7 */
#define IFX_TAPI_KPI_GROUP7       0x7000
/** Definition of KPI group 8 */
#define IFX_TAPI_KPI_GROUP8       0x8000
/** Definition of KPI group 9 */
#define IFX_TAPI_KPI_GROUP9       0x9000
/** Definition of KPI group 10 */
#define IFX_TAPI_KPI_GROUP10      0xA000
/** Definition of KPI group 11 */
#define IFX_TAPI_KPI_GROUP11      0xB000
/** Definition of KPI group 12 */
#define IFX_TAPI_KPI_GROUP12      0xC000
/** Definition of KPI group 13 */
#define IFX_TAPI_KPI_GROUP13      0xD000
/** Definition of KPI group 14 */
#define IFX_TAPI_KPI_GROUP14      0xE000
/** Definition of KPI group 15 */
#define IFX_TAPI_KPI_GROUP15      0xF000


/* ========================================================================== */
/*                             Type definitions                               */
/* ========================================================================== */

/** Type IFX_TAPI_KPI_CH_t is used for the KPI channel numbers. The KPI channel
    consists of the KPI group in the 4 MSB bits and the channel within this
    group in the LSB bits of this type. So channel 5 in group 2 is built as
    (IFX_TAPI_KPI_GROUP2 | 0x0005) */
typedef IFX_uint16_t    IFX_TAPI_KPI_CH_t;

/** Enum used to name the packet streams that can be redirected to KPI */
typedef enum
{
   /** Source stream generated by CODer. */
   IFX_TAPI_KPI_STREAM_COD,
   /** Source stream generated by DECT. */
   IFX_TAPI_KPI_STREAM_DECT,
   /** Maximum stream. */
   IFX_TAPI_KPI_STREAM_MAX
} IFX_TAPI_KPI_STREAM_t;

/** Struct to configure the redirection of packet streams to the KPI.
    Used by IOCTL \ref IFX_TAPI_KPI_CH_CFG_SET.

    \remarks
      stream = COD & KPI group = 0 : Default, stream will be sent to user space.
      stream = COD & KPI group > 0 : Packet stream will be sent to KPI.
      stream = DECT & KPI group = 0 : DECT packet stream will be discarded.
      stream = DECT & KPI group > 0 : DECT packet stream will be sent to KPI.
*/
typedef struct
{
   /** Packet stream that should be redirected see \ref IFX_TAPI_KPI_STREAM_t. */
   IFX_TAPI_KPI_STREAM_t     nStream;
   /** KPI group and channel where the stream should be sent to. */
   IFX_TAPI_KPI_CH_t         nKpiCh;
} IFX_TAPI_KPI_CH_CFG_t;


/* ========================================================================== */
/*                           Function prototypes                              */
/* ========================================================================== */

/** Sleep until data is available for reading with \ref IFX_TAPI_KPI_ReadData.

   \param nKpiGroup KPI group where to read the packet from.

   \return Returns value as follows:
   - \ref IFX_SUCCESS: if successful
   - \ref IFX_ERROR: in case of an error
 */
extern IFX_return_t IFX_TAPI_KPI_WaitForData (IFX_TAPI_KPI_CH_t nKpiGroup );

/** Read packet from TAPI KPI.

   \param nKpiGroup KPI group where to read the packet from.
   \param nKpiChannel Pointer to KPI channel number for the read packet. This
     parameter is returned by the function.
   \param pPacket Pointer to the bufferpool element containing the read packet.
    This parameter is returned by the function. The buffer allocation is done by the
    Infineon device drivers. The KPI client is responsible for buffer
    deallocation!
   \param nPacketLength Pointer to length (in bytes) for the read packets.
    This parameter is returned by the function. If the returned length is 0,
    it means that no packets where available for read.
   \param nMore  Pointer to a flag signaling whether (1) or not (0) more packets
    are available for read in the same KPI group. This parameter is returned by
    the function.

   \return Returns value as follows:
   - \ref IFX_SUCCESS: if successful
   - \ref IFX_ERROR: in case of an error
*/
extern IFX_int32_t  IFX_TAPI_KPI_ReadData (IFX_TAPI_KPI_CH_t nKpiGroup,
                                           IFX_TAPI_KPI_CH_t *nKpiChannel,
                                           void **pPacket,
                                           IFX_uint32_t *nPacketLength,
                                           IFX_uint8_t *nMore);

/** Write packet from KPI client to TAPI KPI.

    \param  nKpiChannel   Destination KPI channel.
    \param  pPacket  Bufferpool element containing the packet. The
     bufferpool element must be allocated by the KPI client.
    \param  nPacketLength     Size of the bufferpool element.

   \return Returns value as follows:
   - \ref IFX_SUCCESS: if successful
   - \ref IFX_ERROR: in case of an error
*/
extern IFX_int32_t  IFX_TAPI_KPI_WriteData (IFX_TAPI_KPI_CH_t nKpiChannel,
                                            void *pPacket,
                                            IFX_uint32_t nPacketLength);
/*@}*/ /* TAPI_INTERFACE_KPI */
#endif /* _DRV_TAPI_KPI_IO_H */