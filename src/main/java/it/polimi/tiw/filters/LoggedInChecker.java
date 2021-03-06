package it.polimi.tiw.filters;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

/**
 * Servlet Filter checks if the user is logged in.
 */
@WebFilter({"/GetFolders", "/document", "/move-document", "/create-folder", "/create-subfolder", "/create-document", "/delete-folder", "/delete-document", "/delete-subfolder"})
public class LoggedInChecker implements Filter {

    /**
     * @see Filter#doFilter(ServletRequest, ServletResponse, FilterChain)
     */
    @Override
    public void init(FilterConfig filterConfig) {
    }

    /**
     * Checks if the user is logged in otherwise redirects to the login page.
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpSession session = httpRequest.getSession();
        if (session.isNew() || session.getAttribute("user") == null) {
            ((HttpServletResponse) response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().println("You are not logged in.");
        } else {
            chain.doFilter(request, response);
        }
    }

    /**
     * @see Filter#destroy()
     */
    @Override
    public void destroy() {
    }
}
