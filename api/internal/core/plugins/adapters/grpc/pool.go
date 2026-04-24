// Package grpc manages live gRPC connections to plugin containers.
package grpc

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"sync"

	pluginsv1 "github.com/kleffio/plugin-sdk-go/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

// Pool manages a set of live gRPC connections to plugin containers.
// Connections are keyed by plugin ID. The pool is safe for concurrent use.
type Pool struct {
	mu    sync.RWMutex
	conns map[string]*grpc.ClientConn
}

// NewPool creates an empty connection pool.
func NewPool() *Pool {
	return &Pool{conns: make(map[string]*grpc.ClientConn)}
}

// Dial opens a gRPC connection to the plugin at addr and registers it under id.
// If a connection already exists for id, it is closed first.
// When caCertPEM is non-empty the connection uses mTLS; otherwise it falls back
// to plaintext (only acceptable for local development without TLS configured).
func (p *Pool) Dial(ctx context.Context, id, addr string, caCertPEM []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	// Close existing connection if present.
	if old, ok := p.conns[id]; ok {
		_ = old.Close()
		delete(p.conns, id)
	}

	var transportCreds grpc.DialOption
	if len(caCertPEM) > 0 {
		certPool := x509.NewCertPool()
		certPool.AppendCertsFromPEM(caCertPEM)
		tlsCfg := &tls.Config{
			RootCAs:    certPool,
			ServerName: "kleff-" + id,
		}
		transportCreds = grpc.WithTransportCredentials(credentials.NewTLS(tlsCfg))
	} else {
		transportCreds = grpc.WithTransportCredentials(insecure.NewCredentials())
	}

	conn, err := grpc.NewClient(addr, transportCreds)
	if err != nil {
		return fmt.Errorf("grpc pool: dial %q at %q: %w", id, addr, err)
	}
	p.conns[id] = conn
	return nil
}

// Close closes and removes the connection for the given plugin ID.
// Returns nil if the connection does not exist.
func (p *Pool) Close(id string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	conn, ok := p.conns[id]
	if !ok {
		return nil
	}
	delete(p.conns, id)
	return conn.Close()
}

// CloseAll closes every connection in the pool.
func (p *Pool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for id, conn := range p.conns {
		_ = conn.Close()
		delete(p.conns, id)
	}
}


// IDPClient returns an IdentityPluginClient for the given plugin ID.
func (p *Pool) IDPClient(id string) (pluginsv1.IdentityPluginClient, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	conn, ok := p.conns[id]
	if !ok {
		return nil, fmt.Errorf("grpc pool: no connection for plugin %q", id)
	}
	return pluginsv1.NewIdentityPluginClient(conn), nil
}

// HealthClient returns a PluginHealthClient for the given plugin ID.
func (p *Pool) HealthClient(id string) (pluginsv1.PluginHealthClient, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	conn, ok := p.conns[id]
	if !ok {
		return nil, fmt.Errorf("grpc pool: no connection for plugin %q", id)
	}
	return pluginsv1.NewPluginHealthClient(conn), nil
}

// MiddlewareClient returns a PluginMiddlewareClient for the given plugin ID.
func (p *Pool) MiddlewareClient(id string) (pluginsv1.PluginMiddlewareClient, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	conn, ok := p.conns[id]
	if !ok {
		return nil, fmt.Errorf("grpc pool: no connection for plugin %q", id)
	}
	return pluginsv1.NewPluginMiddlewareClient(conn), nil
}

// UIClient returns a PluginUIClient for the given plugin ID.
func (p *Pool) UIClient(id string) (pluginsv1.PluginUIClient, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	conn, ok := p.conns[id]
	if !ok {
		return nil, fmt.Errorf("grpc pool: no connection for plugin %q", id)
	}
	return pluginsv1.NewPluginUIClient(conn), nil
}

// HTTPPluginClient returns a PluginHTTPClient for the given plugin ID.
func (p *Pool) HTTPPluginClient(id string) (pluginsv1.PluginHTTPClient, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	conn, ok := p.conns[id]
	if !ok {
		return nil, fmt.Errorf("grpc pool: no connection for plugin %q", id)
	}
	return pluginsv1.NewPluginHTTPClient(conn), nil
}

// HasConnection reports whether a live connection exists for id.
func (p *Pool) HasConnection(id string) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	_, ok := p.conns[id]
	return ok
}
