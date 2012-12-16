FLAGS =
FLAGS += --compilation_level ADVANCED_OPTIMIZATIONS
FLAGS += --formatting PRETTY_PRINT
FLAGS += --summary_detail_level 3
FLAGS += --process_closure_primitives
FLAGS += --generate_exports
FLAGS += --output_wrapper '(function(){%output%})()'

#FLAGS += --compilation_level SIMPLE_OPTIMIZATIONS
#FLAGS += --debug

INPUTS = $(sort $(wildcard src/[0-9][0-9]-*.js))
OUTPUTS = test.js

all: $(OUTPUTS)

clean:
	rm -f $(OUTPUTS)

.PHONY: all clean

%.js: $(INPUTS) src/%.js
	closure $(FLAGS) --js_output_file $@ $(foreach x,$^,--js $(x)) \
		--externs externs/*.js || (rm -f $@ && false)

