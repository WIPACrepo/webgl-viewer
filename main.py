#!/bin/sh /cvmfs/icecube.opensciencegrid.org/py2-v1/icetray-start
#METAPROJECT: offline-software/trunk

####!/usr/bin/env python

import os
import logging
import time
from threading import Thread, Timer
from functools import partial
from contextlib import contextmanager
from multiprocessing.pool import ThreadPool
from socket import gethostname

import tornado.ioloop
import tornado.web
import tornado.httpserver
from jsonUtil import json_encode,json_decode
from tornado.escape import url_escape

import geo
import i3

class TemplateHandler(tornado.web.RequestHandler):
    """Handle static templates"""
    def initialize(self, file):
        self.file = file
    def get(self):
        """display the template"""
        self.render(self.file)

class AjaxHandler(tornado.web.RequestHandler):
    def initialize(self, pool, i3data=None):
        self.pool = pool
        self.i3data = i3data
        logging.warn('i3data = %s',self.i3data)

    @tornado.web.asynchronous
    def get(self):
        # is jsonp?
        callback = self.get_argument('callback',False)
        if callback is not False:
            writer = lambda t:self.write(callback+'('+t+')')
        else:
            writer = self.write
        
        # args in GET
        function = self.get_argument('function')
        logging.info('json function: %r',function)

        ret = {'ret':False}
        if function == 'getGCD':
            gcd_filename = self.get_argument('gcd_filename')
            self.pool.apply_async(partial(self.getGCD,gcd_filename,write_callback=writer,complete_callback=self.finish))
            return
        elif function == 'getI3':
            i3_filename = self.get_argument('i3_filename')
            frame_type = self.get_argument('frame_type')
            keys = self.get_argument('keys',None)
            if keys:
                keys = keys.split(',')
            self.pool.apply_async(partial(self.getI3,i3_filename,frame_type,keys,write_callback=writer,complete_callback=self.finish))
            return
        else:
            raise Exception('function invalid')
        
        writer(json_encode(ret))
        self.finish()
    
    @tornado.web.asynchronous
    def post(self):
        # is jsonp?
        callback = self.get_argument('callback',False)
        if callback is not False:
            writer = lambda t:self.write(callback+'('+t+')')
        else:
            writer = self.write
        
        # json decode body
        body = json_decode(self.request.body)
        func = body['function']
        logging.info('json function: %r',body['function'])

        ret = {'ret':False}
        if body['function'] == 'getGCD':
            if 'gcd_filename' not in body:
                raise Exception('gcd_filename not in input')
            self.pool.apply_async(partial(self.getGCD,body['gcd_filename'],write_callback=writer,complete_callback=self.finish))
            return
        elif body['function'] == 'getI3':
            if 'i3_filename' not in body:
                raise Exception('i3_filename not in input')
            if 'frame_type' not in body:
                raise Exception('frame_type not in input')
            keys = None
            if 'keys' in body:
                keys = body['keys']
            self.pool.apply_async(partial(self.getI3,body['i3_filename'],body['frame_type'],keys,write_callback=writer,complete_callback=self.finish))
            return
        else:
            raise Exception('function invalid')
        
        
        writer(json_encode(ret))
        self.finish()
        
    def write_error(self,status_code,**kwargs):
        logging.error('error %r',status_code)
        self.write(json_encode({'ret':None,'error':[status_code]}))
        self.finish()
    
    def getGCD(self,gcd_filename,write_callback,complete_callback):
        logging.info('getGCD for %r',gcd_filename)
        try:
            filename = str(gcd_filename)
            if not filename.startswith('/') and self.i3data:
                filename = os.path.join(self.i3data,filename)
            ret = geo.parseGCD(filename)
        except Exception as e:
            logging.error('error parsing GCD: %r',e,exc_info=True)
            def cb():
                write_callback(json_encode({'ret':None,'error':[400]}))
                complete_callback()
        else:
            def cb():
                write_callback(json_encode({'ret':True,'data':ret}))
                complete_callback()
        tornado.ioloop.IOLoop.instance().add_callback(cb)

    def getI3(self,i3_filename,frame_type,keys,write_callback,complete_callback):
        logging.info('getI3 for %r',i3_filename)
        logging.info('get only the keys: %r',keys)
        try:
            filename = str(i3_filename)
            if not filename.startswith('/') and self.i3data:
                filename = os.path.join(self.i3data,filename)
            ret = i3.parseI3(filename,str(frame_type),keys=keys,nframes=1000)
        except Exception as e:
            logging.error('error parsing I3: %r',e,exc_info=True)
            def cb():
                write_callback(json_encode({'ret':None,'error':[400]}))
                complete_callback()
        else:
            def cb():
                write_callback(json_encode({'ret':True,'data':ret}))
                complete_callback()
        tornado.ioloop.IOLoop.instance().add_callback(cb)

        
def logger(handler):
    if handler.get_status() < 400:
        log_method = logging.info
    elif handler.get_status() < 500:
        log_method = logging.warning
    else:
        log_method = module.logger.error
    request_time = 1000.0 * handler.request.request_time()
    log_method("%d %s %.2fms", handler.get_status(),
               handler._request_summary(), request_time)

def start_browser(browser,url):
    import webbrowser
    time.sleep(1)
    b = webbrowser.get(browser)
    b.open(url)
    
def main(options,files):
    
    logging.basicConfig(level=loglevel)
    
    if not options.daemon:
        url = 'http://'+gethostname()+':'+str(options.port)
        if files:
            url += '/alt#' + ','.join(files)
        if options.open_browser:
            Thread(target=start_browser,args=(options.browser,url)).start()
        else:
            print 'open browser and go to'
            print url
    pool = ThreadPool(10)

    application = tornado.web.Application([
        (r'/ajax', AjaxHandler, dict(pool=pool,i3data=options.event_viewer_data)),
        (r'/alt', TemplateHandler, dict(file='alt.html')),
        (r'/quiz', TemplateHandler, dict(file='quiz.html')),
        (r'/training', TemplateHandler, dict(file='training.html')),
        (r'/high_energy', TemplateHandler, dict(file='high_energy.html')),
        (r'/hese3', TemplateHandler, dict(file='hese3.html')),
        (r'/hese_all_28', TemplateHandler, dict(file='hese_all_28.html')),
        (r'/background_signal', TemplateHandler, dict(file='background_signal.html')),
        (r'/icetop', TemplateHandler, dict(file='icetop.html')),
        (r'/speed_of_light', TemplateHandler, dict(file='speed_of_light.html')),
        (r'/he_neutrinos', TemplateHandler, dict(file='he_neutrinos.html')),
        (r'/', TemplateHandler, dict(file='main.html')),
    ], static_path='static', template_path='templates',
      log_function=logger)

    logging.basicConfig(level=options.loglevel)
    
    application.listen(options.port)
    logging.info('listening on port: %d',options.port)
    try:
        tornado.ioloop.IOLoop.instance().start()
    except:
        logging.error('STOPPED')

    # finish pool
    pool.terminate()
    
    
if __name__ == '__main__':

    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option('-p', '--port', dest='port', type='int', default=49382,
                      help='assign to port (default 49382)')
    parser.add_option('-b', '--browser', dest='browser', type='string',
                      default=None, help='browser type to open')
    parser.add_option('--no-browser', dest='open_browser',
                      action='store_false', default=True,
                      help='do not open browser')
    parser.add_option('--event-viewer-data', dest='event_viewer_data', type='string',
                      default=None, help='Default location to event viewer data')
    parser.add_option('--daemon',dest='daemon',default=False,action='store_true',
                      help='Daemonize the server')
    parser.add_option('--log',dest='log',default=None,action='store',
                      type='string',help='Set log file')
    parser.add_option('--loglevel',dest='loglevel',default=None,action='store',
                      type='string',help='Set log file')
    (options, files) = parser.parse_args()
    
    loglevel = logging.WARN
    if options.loglevel:
        ll = options.loglevel.lower()
        if ll in ('critical','fatal'):
            loglevel = logging.FATAL
        elif ll == 'error':
            loglevel = logging.ERROR
        elif ll in ('warn','warning'):
            loglevel = logging.WARN
        elif ll == 'info':
            loglevel = logging.INFO
        elif ll == 'debug':
            loglevel = logging.DEBUG
    options.loglevel = loglevel

    if options.daemon:
        if files:
            raise Exception('cannot specifiy --daemon and files at the same time')
        print 'making daemon'
        import os
        import daemon
        kwargs = {'working_directory':os.getcwd()}
        if options.log:
            f = open(options.log,'a')
            kwargs['stdout'] = f
            kwargs['stderr'] = f
        with daemon.DaemonContext(**kwargs):
            print 'running daemon'
            main(options,files)
    else:
        main(options,files)
