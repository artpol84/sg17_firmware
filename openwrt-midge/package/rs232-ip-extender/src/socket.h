#ifndef  RS232_IP_EXTENDER_SOCKET_H
# define RS232_IP_EXTENDER_SOCKET_H


typedef struct socket_s
{
    char *name;
    int fd;
} socket_t;

socket_t *socket_create (void);
void      socket_delete (socket_t *s);

void      socket_bind    (socket_t *s, const char *host, const char *port);
socket_t *socket_accept  (socket_t *s);
void      socket_connect (socket_t *s, const char *host, const char *port);
void      socket_close   (socket_t *s);
size_t    socket_send    (socket_t *s, const char *buf, size_t len);
void      socket_send_all(socket_t *s, const char *buf, size_t len);
size_t    socket_recv    (socket_t *s,       char *buf, size_t len);


#endif //RS232_IP_EXTENDER_SOCKET_H
