#ifndef  RS232_IP_EXTENDER_MISC_H
# define RS232_IP_EXTENDER_MISC_H


extern const char *progname;

void fail(void);

void onexit(void (*function)(int, void *), void *arg);

static inline void* deconst(const void* arg)
{
    union { const void *cvp; void *vp; } u;
    u.cvp = arg;
    return u.vp;
}

void * xmalloc(size_t size);
void *xzmalloc(size_t size);
char *xstrdup(const char *src);


#endif //RS232_IP_EXTENDER_MISC_H
