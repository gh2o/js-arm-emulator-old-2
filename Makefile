FLAGS =
FLAGS += --compilation_level ADVANCED_OPTIMIZATIONS
FLAGS += --formatting PRETTY_PRINT
FLAGS += --summary_detail_level 3
FLAGS += --process_closure_primitives
FLAGS += --generate_exports
FLAGS += --output_wrapper '(function(){%output%})()'

#FLAGS += --compilation_level SIMPLE_OPTIMIZATIONS
#FLAGS += --debug
#FLAGS += --compilation_level WHITESPACE_ONLY

INPUTS = $(sort $(wildcard src/[0-9][0-9]-*.js))
OUTPUTS = jae-local.js jae-web.js

all: $(OUTPUTS)

clean:
	rm -f $(OUTPUTS)

.PHONY: all clean

ifneq ($(JUSTCAT),)
%.js: $(INPUTS) src/%.js
	cat $^ > $@
else
%.js: $(INPUTS) src/%.js
	closure $(FLAGS) --js_output_file $@ $(foreach x,$^,--js $(x)) \
		--externs externs/*.js || (rm -f $@ && false)
endif

